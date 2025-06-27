// server/controllers/generate.controller.js

const ExcelJS = require('exceljs');
const { parse } = require('csv-parse'); // For parsing pasted Excel data
const { create } = require('xmlbuilder2'); // For building XML
const Company = require('../models/Company');
const Lookup = require('../models/Lookup');

// Helper function to format date to ddMMyy
const formatDateToDdMMyy = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = String(d.getFullYear()).slice(-2); // Last two digits of year
    return `${day}${month}${year}`;
};

/**
 * Generates an Excel template for invoice data entry.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.generateExcelTemplate = async (req, res) => {
    try {
        const userId = req.userId; // Assuming userId is available from auth middleware
        const { companyId } = req.query; // Company ID from query parameter

        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required to generate the template.' });
        }

        const selectedCompany = await Company.findByIdAndUserId(companyId, userId);

        if (!selectedCompany) {
            return res.status(404).json({ message: 'Selected company not found or not authorized.' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'XML Invoice Generator';
        workbook.lastModifiedBy = 'XML Invoice Generator';
        workbook.created = new Date();
        workbook.modified = new Date();
        workbook.views = [
            {
                x: 0, y: 0, width: 10000, height: 20000,
                firstSheet: 0, activeTab: 1, visibility: 'show'
            }
        ];

        // Fetch lookup descriptions for dynamic guidance
        const documentTypes = await Lookup.getDocumentTypes();
        const documentTypeMap = new Map(documentTypes.map(item => [item.code, item.description]));
        const partnerIdentifierTypes = await Lookup.getPartnerIdentifierTypes();
        const partnerIdentifierTypeMap = new Map(partnerIdentifierTypes.map(item => [item.code, item.description]));
        const dateFunctions = await Lookup.getDateFunctions();
        const dateFunctionMap = new Map(dateFunctions.map(item => [item.code, item.description]));
        const partnerFunctions = await Lookup.getPartnerFunctions();
        const partnerFunctionMap = new Map(partnerFunctions.map(item => [item.code, item.description]));
        const taxTypes = await Lookup.getTaxTypes();
        const taxTypeMap = new Map(taxTypes.map(item => [item.code, item.description]));
        const paymentTermsTypes = await Lookup.getPaymentTermsTypes();
        const paymentTermsTypeMap = new Map(paymentTermsTypes.map(item => [item.code, item.description]));
        const paymentMeans = await Lookup.getPaymentMeans();
        const paymentMeansMap = new Map(paymentMeans.map(item => [item.code, item.description]));
        const communicationMeans = await Lookup.getCommunicationMeans();
        const communicationMeansMap = new Map(communicationMeans.map(item => [item.code, item.description]));
        const freeTextSubjects = await Lookup.getFreeTextSubjects();
        const freeTextSubjectsMap = new Map(freeTextSubjects.map(item => [item.code, item.description]));


        // --- Sheet 1: Invoice Header & Summary Data ---
        const headerSheet = workbook.addWorksheet('En-tête Facture', {
            views: [{ showGridLines: true }]
        });

        // Add a legend at the top
        headerSheet.addRow(['Légende des Couleurs:']);
        headerSheet.getCell('A1').font = { bold: true, size: 14 };
        headerSheet.mergeCells('A1:E1');

        headerSheet.addRow(['']); // Empty row for spacing

        // Legend for user input - now with background color
        const userInputLegendRow = headerSheet.addRow([
            '',
            'À Remplir (Données Requises / Obligatoires) (Fond jaune clair)',
            '', '', ''
        ]);
        userInputLegendRow.getCell(2).font = { bold: true, color: { argb: 'FFC00000' } }; // Red text
        userInputLegendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; // Light yellow background
        headerSheet.mergeCells(userInputLegendRow.getCell(2).address + ':' + userInputLegendRow.getCell(5).address);

        // Legend for pre-filled/static
        const prefilledLegendRow = headerSheet.addRow([
            '',
            'Pré-rempli / Statique (Ne pas modifier)',
            '', '', ''
        ]);
        prefilledLegendRow.getCell(2).font = { bold: true, color: { argb: 'FF0000FF' } }; // Blue text
        headerSheet.mergeCells(prefilledLegendRow.getCell(2).address + ':' + prefilledLegendRow.getCell(5).address);

        // Legend for calculated
        const calculatedLegendRow = headerSheet.addRow([
            '',
            'Calculé (Ne pas modifier)',
            '', '', ''
        ]);
        calculatedLegendRow.getCell(2).font = { bold: true, color: { argb: 'FF808080' } }; // Grey text
        headerSheet.mergeCells(calculatedLegendRow.getCell(2).address + ':' + calculatedLegendRow.getCell(5).address);

        headerSheet.addRow(['']); // Empty row for spacing
        headerSheet.addRow(['']); // Empty row for spacing


        // Define columns and explicitly add header row for Invoice Header sheet
        const headerSheetColumns = [
            { header: 'Champ XML', key: 'xmlPath', width: 40 },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Valeur', key: 'value', width: 40 },
            { header: 'Notes / Contraintes', key: 'notes', width: 60 },
            { header: 'Exemple', key: 'example', width: 30 }
        ];
        headerSheet.columns = headerSheetColumns; // Set column properties

        // Add the actual header row data
        headerSheet.addRow(headerSheetColumns.map(col => col.header));
        const actualHeaderRowForHeaderSheet = headerSheet.lastRow;


        // Helper to add row with specific styling for 'value' cell
        const addHeaderDataRow = (xmlPath, description, value, notes, example, type = 'user_input') => {
            const row = headerSheet.addRow({ xmlPath, description, value, notes, example });
            const valueCell = row.getCell(3); // 'Valeur' column

            let fontColor = { argb: 'FFC00000' }; // Default to Red for user input
            let fillColor = null; // Default no fill

            if (type === 'pre_filled') {
                fontColor = { argb: 'FF0000FF' }; // Blue for pre-filled / static
            } else if (type === 'calculated') {
                fontColor = { argb: 'FF808080' }; // Grey for calculated
            } else if (type === 'user_input') {
                fillColor = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; // Light yellow for user input background
            }

            valueCell.font = { color: fontColor }; // Apply font color
            if (fillColor) {
                valueCell.fill = fillColor; // Apply background fill if specified
            }
        };

        // Header Section (Static / Pre-filled)
        addHeaderDataRow('TEIF.@version', 'Version de la Facture', '1.8.8', 'Valeur statique, ne pas modifier.', '1.8.8', 'pre_filled');
        addHeaderDataRow('TEIF.@controlingAgency', 'Agence de Contrôle', 'TTN', 'Valeur statique, ne pas modifier.', 'TTN', 'pre_filled');
        addHeaderDataRow('InvoiceHeader.MessageSenderIdentifier', 'Identifiant de l\'Expéditeur (Matricule Fiscal)', selectedCompany.tax_id, 'Pré-rempli depuis votre entreprise sélectionnée.', selectedCompany.tax_id, 'pre_filled');
        addHeaderDataRow('InvoiceHeader.MessageSenderIdentifier.@type', 'Type d\'Identifiant Expéditeur', selectedCompany.tax_id_type_code, `Pré-rempli depuis votre entreprise sélectionnée. (${selectedCompany.tax_id_type_code}: ${partnerIdentifierTypeMap.get(selectedCompany.tax_id_type_code) || 'N/A'})`, selectedCompany.tax_id_type_code, 'pre_filled');

        // Required User Input (Receiver)
        addHeaderDataRow('InvoiceHeader.MessageRecieverIdentifier', 'Identifiant du Destinataire (Matricule Fiscal/CIN)', '', 'Requis. Ex: MF, CIN, Carte de Séjour. Doit correspondre au Type d\'Identifiant Destinataire. (Max 35 chars)', '7890123456789', 'user_input');
        addHeaderDataRow('InvoiceHeader.MessageRecieverIdentifier.@type', 'Type d\'Identifiant Destinataire', '', `Requis. Choisir parmi: ${Array.from(partnerIdentifierTypeMap.keys()).map(code => `${code} (${partnerIdentifierTypeMap.get(code) || 'N/A'})`).join(', ')}.`, 'I-01', 'user_input');
        addHeaderDataRow('InvoiceBody.Bgm.DocumentIdentifier', 'Numéro de Facture', '', 'Requis. Numéro unique de la facture. (Max 70 chars)', 'INV-2024-001', 'user_input');
        addHeaderDataRow('InvoiceBody.Bgm.DocumentType.@code', 'Code Type de Document Facture', 'I-11', `Requis. I-11: ${documentTypeMap.get('I-11') || 'N/A'}. Voir Référentiel I 1.`, 'I-11', 'user_input');
        addHeaderDataRow('InvoiceBody.Bgm.DocumentType', 'Nom Type de Document Facture', documentTypeMap.get('I-11'), 'Pré-rempli d\'après le code. Ne pas modifier.', 'Facture Originale', 'pre_filled');
        addHeaderDataRow('InvoiceBody.Dtm.DateText.functionCode', 'Code Fonction Date Facture', 'I-31', `Requis. I-31: ${dateFunctionMap.get('I-31') || 'N/A'}. Voir Référentiel I 3.`, 'I-31', 'user_input');
        addHeaderDataRow('InvoiceBody.Dtm.DateText.format', 'Format Date Facture', 'ddMMyy', 'Requis. Ex: ddMMyy (250624), ddMMyyHHmm (2506241430).', 'ddMMyy', 'user_input');
        addHeaderDataRow('InvoiceBody.Dtm.DateText', 'Date Facture', formatDateToDdMMyy(new Date()), 'Requis. Date de la facture selon le format spécifié.', formatDateToDdMMyy(new Date()), 'user_input');

        // Sender Party Details (Pre-filled from selected company)
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.functionCode', 'Code Fonction Partenaire (Émetteur)', 'I-61', `Valeur statique: I-61 (${partnerFunctions.find(f => f.code === 'I-61')?.description || 'N/A'}). Ne pas modifier.`, 'I-61', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerName', 'Nom de l\'Émetteur', selectedCompany.name, 'Pré-rempli depuis votre entreprise. (Max 200 chars)', selectedCompany.name, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerName.@nameType', 'Type Nom Émetteur', 'Qualification', 'Valeur statique: Qualification (Nom légal). Ne pas modifier.', 'Qualification', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerAdresses.0.AdressDescription', 'Adresse Complète Émetteur', selectedCompany.address, 'Pré-rempli. Adresse détaillée de l\'expéditeur. (Max 500 chars)', selectedCompany.address, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerAdresses.0.Street', 'Rue Émetteur', selectedCompany.address.split(',')[0] || '', 'Pré-rempli. Partie de l\'adresse (rue, avenue). (Max 35 chars)', selectedCompany.address.split(',')[0] || 'Avenue Principale', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerAdresses.0.CityName', 'Ville Émetteur', selectedCompany.city, 'Pré-rempli. (Max 35 chars)', selectedCompany.city, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerAdresses.0.PostalCode', 'Code Postal Émetteur', selectedCompany.postal_code, 'Pré-rempli. (Max 17 chars)', selectedCompany.postal_code, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.Nad.PartnerAdresses.0.Country', 'Pays Émetteur', selectedCompany.country, 'Pré-rempli. Code ISO 3166-1 alpha-2 (Ex: TN pour Tunisie). (Max 6 chars)', selectedCompany.country, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.CtaSection.Contact.ContactName', 'Nom Contact Émetteur (si applicable)', selectedCompany.contact_name || '', 'Optionnel. Nom du contact chez l\'émetteur. (Max 200 chars)', 'M. Jean Dupont', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.CtaSection.Communication.ComAdress', 'Email Émetteur', selectedCompany.email, 'Pré-rempli. Adresse e-mail de l\'émetteur. (Max 500 chars)', selectedCompany.email, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.CtaSection.Communication.ComMeansType', 'Type Communication Email Émetteur', 'I-102', `Pré-rempli: I-102 (${communicationMeansMap.get('I-102') || 'N/A'}). Ne pas modifier.`, 'I-102', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.CtaSection.Communication.1.ComAdress', 'Téléphone Émetteur', selectedCompany.phone, 'Pré-rempli. Numéro de téléphone de l\'émetteur. (Max 500 chars)', selectedCompany.phone, 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.0.CtaSection.Communication.1.ComMeansType', 'Type Communication Téléphone Émetteur', 'I-101', `Pré-rempli: I-101 (${communicationMeansMap.get('I-101') || 'N/A'}). Ne pas modifier.`, 'I-101', 'pre_filled');


        // Receiver Party Details (User Input)
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.functionCode', 'Code Fonction Partenaire (Récepteur)', 'I-62', `Valeur statique: I-62 (${partnerFunctions.find(f => f.code === 'I-62')?.description || 'N/A'}). Ne pas modifier.`, 'I-62', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerName', 'Nom du Récepteur', '', 'Requis. Nom de l\'entreprise ou personne recevant la facture. (Max 200 chars)', 'Client Alpha S.A.', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerName.@nameType', 'Type Nom Récepteur', 'Qualification', 'Valeur statique: Qualification. Ne pas modifier.', 'Qualification', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.AdressDescription', 'Adresse Complète Récepteur', '', 'Requis. Adresse détaillée du destinataire. (Max 500 chars)', '456 Rue Principale', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.Street', 'Rue Récepteur', '', 'Optionnel. Partie de l\'adresse (rue, avenue). (Max 35 chars)', 'Rue Principale', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.CityName', 'Ville Récepteur', '', 'Requis. (Max 35 chars)', 'Sfax', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.PostalCode', 'Code Postal Récepteur', '', 'Optionnel. (Max 17 chars)', '3000', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.Country', 'Pays Récepteur', 'TN', 'Requis. Code ISO 3166-1 alpha-2 (Ex: TN pour Tunisie). (Max 6 chars)', 'TN', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Contact.ContactName', 'Nom Contact Récepteur (si applicable)', '', 'Optionnel. Nom du contact chez le récepteur. (Max 200 chars)', 'Mme. Sarah Ben Ali', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.ComAdress', 'Email Récepteur', '', 'Optionnel. Adresse e-mail du destinataire. (Max 500 chars)', 'client@alpha.com', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.ComMeansType', 'Type Communication Email Récepteur', 'I-102', `Pré-rempli: I-102 (${communicationMeansMap.get('I-102') || 'N/A'}). Ne pas modifier.`, 'I-102', 'pre_filled');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.1.ComAdress', 'Téléphone Récepteur', '', 'Optionnel. Numéro de téléphone du destinataire. (Max 500 chars)', '+216 XX XXX XXX', 'user_input');
        addHeaderDataRow('InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.1.ComMeansType', 'Type Communication Téléphone Récepteur', 'I-101', `Pré-rempli: I-101 (${communicationMeansMap.get('I-101') || 'N/A'}). Ne pas modifier.`, 'I-101', 'pre_filled');

        // Payment Information (User Input / Static)
        addHeaderDataRow('InvoiceBody.PytSection.PytSectionDetails.0.Pyt.PaymentTearmsTypeCode', 'Code Type Conditions de Paiement', 'I-111', `Requis. Ex: I-111 (${paymentTermsTypeMap.get('I-111') || 'N/A'}). Voir Référentiel I 11.`, 'I-111', 'user_input');
        // FIX: Replaced double quotes with single quotes in example for parsing safety
        addHeaderDataRow('InvoiceBody.PytSection.PytSectionDetails.0.Pyt.PaymentTearmsDescription', 'Description Conditions de Paiement', '', 'Optionnel. Description des conditions de paiement (Ex: \'Net 30 jours\'). (Max 500 chars)', 'Net 30 jours', 'user_input');
        addHeaderDataRow('InvoiceBody.PytSection.PytSectionDetails.0.PytPai.PaiMeansCode', 'Code Moyen de Paiement', 'I-131', `Requis. Ex: I-131 (${paymentMeansMap.get('I-131') || 'N/A'}). Voir Référentiel I 13.`, 'I-131', 'user_input');
        addHeaderDataRow('InvoiceBody.PytSection.PytSectionDetails.0.PytFii.AccountHolder.AccountNumber', 'Numéro de Compte Bancaire', '', 'Requis si Paiement par virement bancaire. IBAN ou numéro de compte de l\'émetteur. (Max 20 chars)', 'TN591000010000000012345678', 'user_input');
        addHeaderDataRow('InvoiceBody.PytSection.PytSectionDetails.0.PytFii.InstitutionIdentification.InstitutionName', 'Nom de la Banque', '', 'Optionnel. Nom de la banque de l\'émetteur. (Max 70 chars)', 'Banque de Tunisie', 'user_input');

        // Free Text (Optional User Input)
        addHeaderDataRow('InvoiceBody.Ftx.FreeTextDetail.0.subjectCode', 'Code Sujet Texte Libre', 'I-41', `Optionnel. Ex: I-41 (${freeTextSubjectsMap.get('I-41') || 'N/A'}). Voir Référentiel I 4.`, 'I-41', 'user_input');
        addHeaderDataRow('InvoiceBody.Ftx.FreeTextDetail.0.FreeTexts', 'Texte Libre', '', 'Optionnel. Tout texte libre pertinent. (Max 500 chars)', 'Merci de votre confiance.', 'user_input');

        // Invoice Level Amounts & Taxes (Calculated, do not modify)
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.0.Moa.Amount', 'Montant Total HT', '[CALCULÉ]', 'Ne pas modifier. Calculé à partir des lignes. Format: NNNN.NNNNN', '300.000', 'calculated');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.0.Moa.Amount.@currencyIdentifier', 'Devise', 'TND', 'Valeur statique, ne pas modifier.', 'TND', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.0.Moa.@currencyCodeList', 'Liste Code Devise', 'ISO_4217', 'Valeur statique, ne pas modifier.', 'ISO_4217', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.0.Moa.@amountTypeCode', 'Code Type Montant (Total HT)', 'I-171', 'Valeur statique: I-171 (Montant net total). Ne pas modifier.', 'I-171', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.1.Moa.Amount', 'Montant Total TTC', '[CALCULÉ]', 'Ne pas modifier. Calculé à partir des lignes et taxes. Format: NNNN.NNNNN', '357.000', 'calculated');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.1.Moa.Amount.@currencyIdentifier', 'Devise', 'TND', 'Valeur statique, ne pas modifier.', 'TND', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.1.Moa.@currencyCodeList', 'Liste Code Devise', 'ISO_4217', 'Valeur statique, ne pas modifier.', 'ISO_4217', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceMoa.AmountDetails.1.Moa.@amountTypeCode', 'Code Type Montant (Total TTC)', 'I-172', 'Valeur statique: I-172 (Montant brut total). Ne pas modifier.', 'I-172', 'pre_filled');

        // Invoice Level Tax (User Input for Type/Rate, Amount Calculated) - Example for one tax type (e.g. TVA)
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Tax.TaxTypeName.@code', 'Code Type Taxe (Niveau Facture)', 'I-1602', `Requis. Ex: I-1602 (${taxTypeMap.get('I-1602') || 'N/A'}). Voir Référentiel I 16. Vous pouvez ajouter plusieurs lignes pour différentes taxes en copiant les colonnes relatives à la taxe.`, 'I-1602', 'user_input');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Tax.TaxTypeName', 'Nom Type Taxe (Niveau Facture)', taxTypeMap.get('I-1602'), 'Pré-rempli d\'après le code. Ne pas modifier.', 'TVA', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Tax.TaxDetails.TaxRate', 'Taux de Taxe (Niveau Facture)', '19.00', 'Requis. Taux de la taxe (Ex: 19.00 pour 19%). Format: NN.NN', '19.00', 'user_input');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.AmountDetails.0.Moa.Amount', 'Montant Total Taxe (Niveau Facture)', '[CALCULÉ]', 'Ne pas modifier. Montant total de cette taxe. Format: NNNN.NNNNN', '57.000', 'calculated');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.AmountDetails.0.Moa.Amount.@currencyIdentifier', 'Devise', 'TND', 'Valeur statique, ne pas modifier.', 'TND', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Moa.@currencyCodeList', 'Liste Code Devise', 'ISO_4217', 'Valeur statique, ne pas modifier.', 'ISO_4217', 'pre_filled');
        addHeaderDataRow('InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.AmountDetails.0.Moa.@amountTypeCode', 'Code Type Montant Taxe (Niveau Facture)', 'I-173', 'Valeur statique: I-173 (Montant total de la taxe). Ne pas modifier.', 'I-173', 'pre_filled');


        // --- Sheet 2: Line Items ---
        const lineItemSheet = workbook.addWorksheet('Lignes de Facture', {
            views: [{ showGridLines: true }]
        });

        // Add a legend at the top of the Line Items sheet as well
        lineItemSheet.addRow(['Légende des Couleurs:']);
        lineItemSheet.getCell('A1').font = { bold: true, size: 14 };
        lineItemSheet.mergeCells('A1:K1'); // Merge across all columns

        lineItemSheet.addRow(['']);

        const lineInputLegendRow = lineItemSheet.addRow([
            '',
            'À Remplir (Données Requises / Obligatoires) (Fond jaune clair)',
            '', '', '', '', '', '', '', '', ''
        ]);
        lineInputLegendRow.getCell(2).font = { bold: true, color: { argb: 'FFC00000' } }; // Red
        lineInputLegendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; // Light yellow background
        lineItemSheet.mergeCells(lineInputLegendRow.getCell(2).address + ':' + lineInputLegendRow.getCell(11).address);

        const lineCalculatedLegendRow = lineItemSheet.addRow([
            '',
            'Calculé (Ne pas modifier)',
            '', '', '', '', '', '', '', '', ''
        ]);
        lineCalculatedLegendRow.getCell(2).font = { bold: true, color: { argb: 'FF808080' } }; // Grey
        lineItemSheet.mergeCells(lineCalculatedLegendRow.getCell(2).address + ':' + lineCalculatedLegendRow.getCell(11).address);

        lineItemSheet.addRow(['']);
        lineItemSheet.addRow(['']);


        // Define columns and explicitly add header row for Line Items sheet
        const lineItemSheetColumns = [
            { header: 'ID Ligne (Article)', key: 'itemIdentifier', width: 20 },
            { header: 'Code Article', key: 'itemCode', width: 20 },
            { header: 'Description Article', key: 'itemDescription', width: 50 },
            { header: 'Quantité', key: 'quantity', width: 15 },
            { header: 'Unité de Mesure (Ex: H87)', key: 'measurementUnit', width: 25 },
            { header: 'Prix Unitaire HT', key: 'unitPriceHT', width: 20 },
            { header: 'Code Type Taxe Ligne (Ex: I-1602)', key: 'lineTaxTypeCode', width: 30 },
            { header: 'Taux de Taxe Ligne (Ex: 19.00)', key: 'lineTaxRate', width: 30 },
            { header: 'Montant Net Ligne [CALCULÉ]', key: 'lineNetCalculated', width: 30 },
            { header: 'Montant Taxe Ligne [CALCULÉ]', key: 'lineTaxCalculated', width: 30 },
            { header: 'Montant TTC Ligne [CALCULÉ]', key: 'lineTTCCalculated', width: 30 },
        ];
        lineItemSheet.columns = lineItemSheetColumns; // Set column properties

        // Add the actual header row data
        lineItemSheet.addRow(lineItemSheetColumns.map(col => col.header));
        const actualHeaderRowForLineItemSheet = lineItemSheet.lastRow;


        // Helper to add line item row and apply styling
        const addLineItemDataRow = (data) => {
            const row = lineItemSheet.addRow(data);
            // Apply red font and light yellow background to user input cells
            const userInputCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Corresponds to itemIdentifier to lineTaxRate
            userInputCols.forEach(colLetter => {
                row.getCell(colLetter).font = { color: { argb: 'FFC00000' } };
                row.getCell(colLetter).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }; // Light yellow background
            });

            // Apply grey font to calculated cells
            const calculatedCols = ['I', 'J', 'K']; // Corresponds to calculated fields
            calculatedCols.forEach(colLetter => {
                row.getCell(colLetter).font = { color: { argb: 'FF808080' } };
            });
        };


        addLineItemDataRow({
            itemIdentifier: 'ARTICLE001',
            itemCode: 'PROD-A',
            itemDescription: 'Services de consultation Logiciel',
            quantity: '10.00',
            measurementUnit: 'H87', // Piece/Unit (e.g., "PCE", "KG", "EA", "H87" for unit)
            unitPriceHT: '30.000',
            lineTaxTypeCode: 'I-1602', // TVA
            lineTaxRate: '19.00',
            lineNetCalculated: '[CALCULÉ]',
            lineTaxCalculated: '[CALCULÉ]',
            lineTTCCalculated: '[CALCULÉ]',
        });
        addLineItemDataRow({
            itemIdentifier: 'ARTICLE002',
            itemCode: 'SERV-B',
            itemDescription: 'Maintenance annuelle',
            quantity: '1.00',
            measurementUnit: 'C62', // Service Unit (e.g., "C62" for one)
            unitPriceHT: '250.000',
            lineTaxTypeCode: 'I-1602', // TVA
            lineTaxRate: '19.00',
            lineNetCalculated: '[CALCULÉ]',
            lineTaxCalculated: '[CALCULÉ]',
            lineTTCCalculated: '[CALCULÉ]',
        });

        // Apply general styling to both sheets
        workbook.eachSheet((sheet) => {
            // Header row styling (bold, light grey background)
            const actualDataHeaderRow = sheet.name === 'En-tête Facture' ? actualHeaderRowForHeaderSheet : actualHeaderRowForLineItemSheet;
            if (actualDataHeaderRow) { // Ensure the row exists
                actualDataHeaderRow.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' } // Light grey background
                    };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.font = { bold: true };
                });
            }

            // Ensure text wrap for notes/descriptions for all cells
            sheet.columns.forEach(column => {
                column.eachCell({ includeEmpty: true }, cell => {
                    cell.alignment = { wrapText: true, vertical: 'top' };
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Facture_Template_${formatDateToDdMMyy(new Date())}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel template:', error);
        res.status(500).json({ message: 'Server error generating Excel template', error: error.message });
    }
};


// --- Helper Functions for Parsing & Validation ---

// Defines the expected headers for the Invoice Header sheet
const INVOICE_HEADER_EXPECTED_HEADERS = [
    'Champ XML', 'Description', 'Valeur', 'Notes / Contraintes', 'Exemple'
];

// Defines the expected headers for the Line Items sheet
const LINE_ITEMS_EXPECTED_HEADERS = [
    'ID Ligne (Article)', 'Code Article', 'Description Article', 'Quantité',
    'Unité de Mesure (Ex: H87)', 'Prix Unitaire HT', 'Code Type Taxe Ligne (Ex: I-1602)',
    'Taux de Taxe Ligne (Ex: 19.00)', 'Montant Net Ligne [CALCULÉ]',
    'Montant Taxe Ligne [CALCULÉ]', 'Montant TTC Ligne [CALCULÉ]'
];

/**
 * Parses tab-separated value (TSV) data.
 * @param {string} dataString - The TSV string.
 * @returns {Promise<Array<Object>>} - Parsed data as an array of objects.
 */
const parseTsv = (dataString) => {
    return new Promise((resolve, reject) => {
        parse(dataString, {
            delimiter: '\t', // Tab-separated
            columns: true, // Use first row as column names
            skip_empty_lines: true,
            trim: true, // Trim whitespace from values
            relax_column_count: true // Allow rows with differing column counts
        }, (err, records) => {
            if (err) {
                return reject(err);
            }
            resolve(records);
        });
    });
};

/**
 * Finds the starting row of actual data by locating the header row.
 * @param {string[]} rows - Array of raw text rows.
 * @param {string[]} expectedHeaders - The headers to look for.
 * @returns {number} - The 0-indexed row number of the header, or -1 if not found.
 */
const findHeaderRowIndex = (rows, expectedHeaders) => {
    for (let i = 0; i < rows.length; i++) {
        // Attempt to parse the row as TSV to get column values
        const currentRowValues = rows[i].split('\t').map(c => c.trim());

        // Check if all expected headers are present in this row
        const allHeadersFound = expectedHeaders.every(expectedHeader =>
            currentRowValues.includes(expectedHeader)
        );

        // Check if the row contains exactly the expected headers (or close enough)
        if (allHeadersFound && currentRowValues.length >= expectedHeaders.length) {
            return i;
        }
    }
    return -1;
};

/**
 * Parses the raw pasted data, separating header and line item sections.
 * @param {string} pastedData - The raw string pasted from Excel.
 * @returns {Object} - Contains parsed header data and line item data.
 * @throws {Error} - If parsing fails or sections are not found.
 */
const parsePastedExcelData = async (pastedData) => {
    const rawRows = pastedData.split('\n');
    let headerDataRaw = [];
    let lineItemDataRaw = [];

    const headerStartIndex = findHeaderRowIndex(rawRows, INVOICE_HEADER_EXPECTED_HEADERS);
    const lineItemStartIndex = findHeaderRowIndex(rawRows, LINE_ITEMS_EXPECTED_HEADERS);

    if (headerStartIndex === -1 && lineItemStartIndex === -1) {
        throw new Error("Impossible de détecter les en-têtes d'en-tête de facture ou de lignes de facture. Veuillez vous assurer d'avoir copié les deux sections correctement à partir du modèle.");
    }

    if (headerStartIndex !== -1 && lineItemStartIndex !== -1) {
        if (headerStartIndex < lineItemStartIndex) {
            headerDataRaw = rawRows.slice(headerStartIndex, lineItemStartIndex);
            lineItemDataRaw = rawRows.slice(lineItemStartIndex);
        } else {
            // This case means line items appear before header, which is unusual for our template
            // We'll treat the first detected block as header, second as line items.
            // Or, more strictly, throw an error if order is unexpected. For now, try to parse.
            lineItemDataRaw = rawRows.slice(lineItemStartIndex, headerStartIndex);
            headerDataRaw = rawRows.slice(headerStartIndex);
        }
    } else if (headerStartIndex !== -1) {
        headerDataRaw = rawRows.slice(headerStartIndex);
    } else { // lineItemStartIndex !== -1
        lineItemDataRaw = rawRows.slice(lineItemStartIndex);
    }

    let parsedHeaderData = [];
    let parsedLineItemData = [];

    try {
        if (headerDataRaw.length > 0) {
            parsedHeaderData = await parseTsv(headerDataRaw.join('\n'));
            // Filter out the header row itself from the parsed data if parse(columns:true) includes it
            parsedHeaderData = parsedHeaderData.filter(row => row['Champ XML'] !== INVOICE_HEADER_EXPECTED_HEADERS[0]);
            // Ensure values are extracted correctly from the 'Valeur' column
            parsedHeaderData = parsedHeaderData.map(row => ({
                xmlPath: row['Champ XML'],
                value: row['Valeur']
            }));
        }
    } catch (error) {
        throw new Error(`Erreur lors du parsing des données d'en-tête: ${error.message}`);
    }

    try {
        if (lineItemDataRaw.length > 0) {
            parsedLineItemData = await parseTsv(lineItemDataRaw.join('\n'));
            // Filter out the header row from line items
            parsedLineItemData = parsedLineItemData.filter(row => row['ID Ligne (Article)'] !== LINE_ITEMS_EXPECTED_HEADERS[0]);
        }
    } catch (error) {
        throw new Error(`Erreur lors du parsing des données de lignes: ${error.message}`);
    }

    return { parsedHeaderData, parsedLineItemData };
};


/**
 * Validates a single field against XSD-like rules.
 * @param {string} value - The field value.
 * @param {Object} rules - Validation rules (e.g., { required: true, minLength: 1, maxLength: 35, pattern: /regex/, enum: ['A', 'B'] }).
 * @param {string} fieldName - Human-readable field name for error messages.
 * @param {Array<string>} errors - Array to push error messages into.
 * @returns {boolean} - True if valid, false otherwise.
 */
const validateField = (value, rules, fieldName, errors) => {
    let isValid = true;
    const trimmedValue = value ? String(value).trim() : ''; // Ensure value is a string before trimming

    if (rules.required && !trimmedValue) {
        errors.push(`${fieldName}: Ce champ est requis.`);
        isValid = false;
    }

    if (trimmedValue) { // Only apply other rules if value is present
        if (rules.maxLength && trimmedValue.length > rules.maxLength) {
            errors.push(`${fieldName}: La longueur maximale est de ${rules.maxLength} caractères (actuel: ${trimmedValue.length}).`);
            isValid = false;
        }

        if (rules.minLength && trimmedValue.length < rules.minLength) {
            errors.push(`${fieldName}: La longueur minimale est de ${rules.minLength} caractères (actuel: ${trimmedValue.length}).`);
            isValid = false;
        }

        if (rules.pattern && !rules.pattern.test(trimmedValue)) {
            errors.push(`${fieldName}: Le format '${trimmedValue}' est invalide. Attendu: ${rules.pattern.source}.`);
            isValid = false;
        }

        if (rules.enum && !rules.enum.includes(trimmedValue)) {
            errors.push(`${fieldName}: La valeur '${trimmedValue}' est invalide. Les valeurs permises sont: ${rules.enum.join(', ')}.`);
            isValid = false;
        }

        if (rules.type === 'number' && trimmedValue && isNaN(parseFloat(trimmedValue))) {
            errors.push(`${fieldName}: Doit être un nombre valide.`);
            isValid = false;
        }

        if (rules.type === 'date' && trimmedValue) {
            // Simple date format ddMMyy validation
            if (!/^\d{6}$/.test(trimmedValue)) {
                errors.push(`${fieldName}: Le format de date doit être 'ddMMyy' (ex: 250624).`);
                isValid = false;
            } else {
                const day = parseInt(trimmedValue.substring(0, 2), 10);
                const month = parseInt(trimmedValue.substring(2, 4), 10);
                const year = parseInt(trimmedValue.substring(4, 6), 10) + 2000; // Assume 20xx
                // Basic check for month/day range
                if (day < 1 || day > 31 || month < 1 || month > 12) {
                    errors.push(`${fieldName}: Jour ou mois invalide dans '${trimmedValue}'.`);
                    isValid = false;
                } else {
                    const dateObj = new Date(year, month - 1, day);
                    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
                        errors.push(`${fieldName}: Date '${trimmedValue}' invalide (ex: 31 février).`);
                        isValid = false;
                    }
                }
            }
        }
        // Monetary amount specific pattern
        if (rules.type === 'monetaryAmount' && trimmedValue && !/^-?[0-9]{1,15}(\.[0-9]{1,5})?$/.test(trimmedValue)) {
            errors.push(`${fieldName}: Le format du montant '${trimmedValue}' est invalide. Attendu: NNNN.NNNNN (max 15 chiffres entiers, max 5 décimales).`);
            isValid = false;
        }
    }
    return isValid;
};


/**
 * Centralized function to validate parsed invoice data against XSD rules.
 * This function is used by both validateExcelData (for quick feedback) and generateXmlInvoice.
 * @param {Object} data - Contains parsedHeaderData and parsedLineItemData.
 * @param {Object} selectedCompany - Details of the sender company.
 * @returns {Object} - { success: boolean, errors: string[], invoiceData: Object }
 */
const validateInvoiceData = async (data, selectedCompany) => {
    let errors = [];
    const { parsedHeaderData, parsedLineItemData } = data;
    const lookupMaps = await getLookupMaps(); // Fetch lookup maps once

    // Initialize invoice object with known static/pre-filled parts
    const invoiceData = {
        TEIF: {
            _attributes: { version: '1.8.8', controlingAgency: 'TTN' },
            InvoiceHeader: {
                MessageSenderIdentifier: {
                    _value: selectedCompany.tax_id,
                    _attributes: { type: selectedCompany.tax_id_type_code }
                },
                MessageRecieverIdentifier: {}, // Populated from parsedHeaderData
            },
            InvoiceBody: {
                Bgm: {
                    DocumentIdentifier: '',
                    DocumentType: { _attributes: { code: '' }, _value: '' },
                    DocumentReferences: null // Optional, not in template for simplicity
                },
                Dtm: {
                    DateText: []
                },
                PartnerSection: {
                    PartnerDetails: [] // Sender (pre-filled) and Receiver (user input)
                },
                PytSection: { PytSectionDetails: [] }, // Payment info
                Ftx: null, // Free text
                SpecialConditions: null, // Optional, not in template for simplicity
                LinSection: { Lin: [] }, // Line items
                InvoiceMoa: { AmountDetails: [] }, // Invoice totals
                InvoiceTax: { InvoiceTaxDetails: [] }, // Invoice taxes
                InvoiceAlc: null // Optional, not in template for simplicity
            },
            AdditionnalDocuments: null, // Optional
            RefTtnVal: null // Optional
        }
    };

    let receiverIdentifierType = null, receiverIdentifierValue = null;
    let invoiceDateFuncCode = null, invoiceDateFormat = null, invoiceDateValue = null;
    let receiverName = null, receiverAddress = null, receiverStreet = null, receiverCity = null, receiverPostalCode = null, receiverCountry = null;
    let receiverContactName = null, receiverEmail = null, receiverPhone = null;
    let paymentTermCode = null, paymentTermDescription = null;
    let paymentMeansCode = null;
    let bankAccountNumber = null, bankName = null;
    let freeTextSubjectCode = null, freeTextValue = null;
    let invoiceTaxTypeCode = null, invoiceTaxRate = null;

    // --- Process Invoice Header Data ---
    parsedHeaderData.forEach(item => {
        const value = item.value || ''; // Handle potential null/undefined values

        switch (item.xmlPath) {
            case 'InvoiceHeader.MessageRecieverIdentifier':
                // Do not validate pattern here, wait for @type
                receiverIdentifierValue = value;
                break;
            case 'InvoiceHeader.MessageRecieverIdentifier.@type':
                 const validPartnerIdTypes = Array.from(lookupMaps.partnerIdentifierTypeMap.keys());
                if (validateField(value, { required: true, enum: validPartnerIdTypes }, "Type Identifiant Destinataire", errors)) {
                    receiverIdentifierType = value;
                }
                break;
            case 'InvoiceBody.Bgm.DocumentIdentifier':
                if (validateField(value, { required: true, maxLength: 70 }, "Numéro de Facture", errors)) {
                    invoiceData.TEIF.InvoiceBody.Bgm.DocumentIdentifier = value;
                }
                break;
            case 'InvoiceBody.Bgm.DocumentType.@code':
                const validDocTypes = Array.from(lookupMaps.documentTypeMap.keys());
                if (validateField(value, { required: true, enum: validDocTypes }, "Code Type Document Facture", errors)) {
                    invoiceData.TEIF.InvoiceBody.Bgm.DocumentType._attributes.code = value;
                    invoiceData.TEIF.InvoiceBody.Bgm.DocumentType._value = lookupMaps.documentTypeMap.get(value) || '';
                }
                break;
            case 'InvoiceBody.Dtm.DateText.functionCode':
                const validDateFuncs = Array.from(lookupMaps.dateFunctionMap.keys());
                if (validateField(value, { required: true, enum: validDateFuncs }, "Code Fonction Date Facture", errors)) {
                    invoiceDateFuncCode = value;
                }
                break;
            case 'InvoiceBody.Dtm.DateText.format':
                if (validateField(value, { required: true, enum: ['ddMMyy', 'ddMMyyHHmm', 'ddMMyy-ddMMyy'] }, "Format Date Facture", errors)) {
                    invoiceDateFormat = value;
                }
                break;
            case 'InvoiceBody.Dtm.DateText':
                if (validateField(value, { required: true, type: 'date' }, "Date Facture", errors)) {
                    invoiceDateValue = value;
                }
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerName':
                if (validateField(value, { required: true, maxLength: 200 }, "Nom du Récepteur", errors)) {
                    receiverName = value;
                }
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.AdressDescription':
                if (validateField(value, { required: true, maxLength: 500 }, "Adresse Complète Récepteur", errors)) {
                    receiverAddress = value;
                }
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.Street':
                validateField(value, { maxLength: 35 }, "Rue Récepteur", errors);
                receiverStreet = value;
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.CityName':
                if (validateField(value, { required: true, maxLength: 35 }, "Ville Récepteur", errors)) {
                    receiverCity = value;
                }
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.PostalCode':
                validateField(value, { maxLength: 17 }, "Code Postal Récepteur", errors);
                receiverPostalCode = value;
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.Nad.PartnerAdresses.0.Country':
                // Validate against ISO_3166-1 codes (e.g., 'TN')
                if (validateField(value, { required: true, enum: ['TN', 'FR', 'DZ', 'MA', 'US', 'GB'] }, "Pays Récepteur", errors)) { // Added common examples
                    receiverCountry = value;
                }
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Contact.ContactName':
                validateField(value, { maxLength: 200 }, "Nom Contact Récepteur", errors);
                receiverContactName = value;
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.ComAdress':
                validateField(value, { maxLength: 500 }, "Email Récepteur", errors);
                receiverEmail = value;
                break;
            case 'InvoiceBody.PartnerSection.PartnerDetails.1.CtaSection.Communication.1.ComAdress':
                validateField(value, { maxLength: 500 }, "Téléphone Récepteur", errors);
                receiverPhone = value;
                break;
            case 'InvoiceBody.PytSection.PytSectionDetails.0.Pyt.PaymentTearmsTypeCode':
                const validPaymentTerms = Array.from(lookupMaps.paymentTermsTypeMap.keys());
                if (validateField(value, { required: true, enum: validPaymentTerms }, "Code Type Conditions de Paiement", errors)) {
                    paymentTermCode = value;
                }
                break;
            case 'InvoiceBody.PytSection.PytSectionDetails.0.Pyt.PaymentTearmsDescription':
                validateField(value, { maxLength: 500 }, "Description Conditions de Paiement", errors);
                paymentTermDescription = value;
                break;
            case 'InvoiceBody.PytSection.PytSectionDetails.0.PytPai.PaiMeansCode':
                const validPaymentMeans = Array.from(lookupMaps.paymentMeansMap.keys());
                if (validateField(value, { required: true, enum: validPaymentMeans }, "Code Moyen de Paiement", errors)) {
                    paymentMeansCode = value;
                }
                break;
            case 'InvoiceBody.PytSection.PytSectionDetails.0.PytFii.AccountHolder.AccountNumber':
                validateField(value, { maxLength: 20 }, "Numéro de Compte Bancaire", errors);
                bankAccountNumber = value;
                break;
            case 'InvoiceBody.PytSection.PytSectionDetails.0.PytFii.InstitutionIdentification.InstitutionName':
                validateField(value, { maxLength: 70 }, "Nom de la Banque", errors);
                bankName = value;
                break;
            case 'InvoiceBody.Ftx.FreeTextDetail.0.subjectCode':
                validateField(value, { enum: Array.from(lookupMaps.freeTextSubjectsMap.keys()) }, "Code Sujet Texte Libre", errors);
                freeTextSubjectCode = value;
                break;
            case 'InvoiceBody.Ftx.FreeTextDetail.0.FreeTexts':
                validateField(value, { maxLength: 500 }, "Texte Libre", errors);
                freeTextValue = value;
                break;
            case 'InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Tax.TaxTypeName.@code':
                const validTaxTypes = Array.from(lookupMaps.taxTypeMap.keys());
                if (validateField(value, { required: true, enum: validTaxTypes }, "Code Type Taxe (Niveau Facture)", errors)) {
                    invoiceTaxTypeCode = value;
                }
                break;
            case 'InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.Tax.TaxDetails.TaxRate':
                if (validateField(value, { required: true, type: 'number', pattern: /^[0-9]{1,2}(\.[0-9]{1,2})?$/ }, "Taux de Taxe (Niveau Facture)", errors)) { // Pattern for percentage, e.g., 19.00
                    invoiceTaxRate = parseFloat(value);
                }
                break;
            // We ignore calculated/pre_filled values from Excel paste as they are derived/static, no validation needed here
            case 'InvoiceBody.InvoiceMoa.AmountDetails.0.Moa.Amount':
            case 'InvoiceBody.InvoiceMoa.AmountDetails.1.Moa.Amount':
            case 'InvoiceBody.InvoiceTax.InvoiceTaxDetails.0.AmountDetails.0.Moa.Amount':
                break; // Ignore these calculated fields from user input
            default:
                // Only report errors for fields that are actually part of our expected template structure
                const expectedXmlPaths = headerSheetColumns.map(col => col.key);
                if (item.xmlPath && item.xmlPath !== 'undefined' && !expectedXmlPaths.includes(item.xmlPath)) {
                    errors.push(`Champ d'en-tête inattendu ou non géré dans le modèle: '${item.xmlPath}'`);
                }
                break;
        }
    });

    // Post-processing and final validation for Header Data
    if (receiverIdentifierType && receiverIdentifierValue) {
        // Apply XSD assertions after both parts are available
        if (receiverIdentifierType === 'I-01' && !/^[0-9]{7}[ABCDEFGHJKLMNPQRSTVWXYZ][ABDNP][CMNPE][0-9]{3}$/i.test(receiverIdentifierValue)) {
             errors.push(`Identifiant Destinataire: Le format du Matricule Fiscal Tunisien (Type I-01) est invalide pour '${receiverIdentifierValue}'.`);
        } else if (receiverIdentifierType === 'I-02' && !/^[0-9]{8}$/.test(receiverIdentifierValue)) {
             errors.push(`Identifiant Destinataire: Le format du CIN (Type I-02) est invalide pour '${receiverIdentifierValue}'.`);
        } else if (receiverIdentifierType === 'I-03' && !/^[0-9]{9}$/.test(receiverIdentifierValue)) {
             errors.push(`Identifiant Destinataire: Le format de la Carte de Séjour (Type I-03) est invalide pour '${receiverIdentifierValue}'.`);
        }
        invoiceData.TEIF.InvoiceHeader.MessageRecieverIdentifier = {
            _value: receiverIdentifierValue,
            _attributes: { type: receiverIdentifierType }
        };
    } else {
        errors.push("L'identifiant et le type de l'identifiant du destinataire sont requis.");
    }

    if (!invoiceData.TEIF.InvoiceBody.Bgm.DocumentIdentifier) errors.push("Le numéro de facture est requis.");
    if (!invoiceData.TEIF.InvoiceBody.Bgm.DocumentType._attributes.code) errors.push("Le code du type de document est requis.");
    if (!invoiceDateFuncCode || !invoiceDateFormat || !invoiceDateValue) errors.push("La date de facture, sa fonction et son format sont requis.");
    if (!receiverName || !receiverAddress || !receiverCity || !receiverCountry) errors.push("Le nom, l'adresse, la ville et le pays du récepteur sont requis.");


    // Add date to invoice object
    if (invoiceDateFuncCode && invoiceDateFormat && invoiceDateValue) {
        invoiceData.TEIF.InvoiceBody.Dtm.DateText.push({
            _value: invoiceDateValue,
            _attributes: { functionCode: invoiceDateFuncCode, format: invoiceDateFormat }
        });
    }

    // Construct Sender PartnerDetails (pre-filled from selectedCompany)
    invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails.push({
        _attributes: { functionCode: 'I-61' }, // Seller
        Nad: {
            PartnerIdentifier: { _value: selectedCompany.tax_id, _attributes: { type: selectedCompany.tax_id_type_code } },
            PartnerName: { _value: selectedCompany.name, _attributes: { nameType: 'Qualification' } },
            PartnerAdresses: [{
                AdressDescription: selectedCompany.address,
                Street: selectedCompany.address.split(',')[0] || '', // Basic split, can be refined
                CityName: selectedCompany.city,
                PostalCode: selectedCompany.postal_code,
                Country: { _value: selectedCompany.country, _attributes: { codeList: 'ISO_3166-1' } }
            }],
            CtaSection: {
                Contact: selectedCompany.contact_name ? { ContactIdentifier: 'CONTACT1', ContactName: selectedCompany.contact_name } : null,
                Communication: []
            }
        }
    });
    if (selectedCompany.email) {
        invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails[0].Nad.CtaSection.Communication.push({
            ComMeansType: 'I-102', // Email
            ComAdress: selectedCompany.email
        });
    }
    if (selectedCompany.phone) {
        invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails[0].Nad.CtaSection.Communication.push({
            ComMeansType: 'I-101', // Phone
            ComAdress: selectedCompany.phone
        });
    }

    // Construct Receiver PartnerDetails (from user input)
    if (receiverName && receiverAddress && receiverCity && receiverCountry) {
        invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails.push({
            _attributes: { functionCode: 'I-62' }, // Buyer
            Nad: {
                PartnerName: { _value: receiverName, _attributes: { nameType: 'Qualification' } },
                PartnerAdresses: [{
                    AdressDescription: receiverAddress,
                    Street: receiverStreet || '',
                    CityName: receiverCity,
                    PostalCode: receiverPostalCode || '',
                    Country: { _value: receiverCountry, _attributes: { codeList: 'ISO_3166-1' } }
                }],
                CtaSection: {
                    Contact: receiverContactName ? { ContactIdentifier: 'CONTACT1', ContactName: receiverContactName } : null,
                    Communication: []
                }
            }
        });
        const receiverPartnerDetailsIndex = invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails.length -1;
        if (receiverEmail) {
            invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails[receiverPartnerDetailsIndex].Nad.CtaSection.Communication.push({
                ComMeansType: 'I-102',
                ComAdress: receiverEmail
            });
        }
        if (receiverPhone) {
            invoiceData.TEIF.InvoiceBody.PartnerSection.PartnerDetails[receiverPartnerDetailsIndex].Nad.CtaSection.Communication.push({
                ComMeansType: 'I-101',
                ComAdress: receiverPhone
            });
        }
    }


    // Process Payment Section
    if (paymentTermCode && paymentMeansCode) {
        invoiceData.TEIF.InvoiceBody.PytSection.PytSectionDetails.push({
            Pyt: {
                PaymentTearmsTypeCode: paymentTermCode,
                PaymentTearmsDescription: paymentTermDescription || ''
            },
            PytPai: {
                PaiConditionCode: 'COND1', // Placeholder for now, if not driven by lookup
                PaiMeansCode: paymentMeansCode
            },
            PytFii: (bankAccountNumber || bankName) ? {
                AccountHolder: bankAccountNumber ? { AccountNumber: bankAccountNumber } : null,
                InstitutionIdentification: bankName ? { BranchIdentifier: 'BRANCH1', InstitutionName: bankName, _attributes: { nameCode: 'SWIFT' } } : null, // Assuming SWIFT as nameCode
                _attributes: { functionCode: 'I-141' } // Payment Account
            } : null
        });
    }


    // Process Free Text
    if (freeTextSubjectCode || freeTextValue) {
        invoiceData.TEIF.InvoiceBody.Ftx = {
            FreeTextDetail: [{
                FreeTexts: freeTextValue || '',
                _attributes: { subjectCode: freeTextSubjectCode || 'I-41' }
            }]
        };
    }


    // --- Process Line Items and Calculate Totals ---
    let totalHT = 0;
    let totalTaxAmount = 0;
    let lineItemCount = 0;

    for (const [index, lineItem] of parsedLineItemData.entries()) {
        const lineNumber = index + 1; // For error reporting
        const itemErrors = [];

        const itemIdentifier = lineItem['ID Ligne (Article)']?.trim();
        const itemCode = lineItem['Code Article']?.trim();
        const itemDescription = lineItem['Description Article']?.trim();
        const quantityStr = lineItem['Quantité']?.trim();
        const measurementUnit = lineItem['Unité de Mesure (Ex: H87)']?.trim();
        const unitPriceHTStr = lineItem['Prix Unitaire HT']?.trim();
        const lineTaxTypeCode = lineItem['Code Type Taxe Ligne (Ex: I-1602)']?.trim();
        const lineTaxRateStr = lineItem['Taux de Taxe Ligne (Ex: 19.00)']?.trim();

        if (!validateField(itemIdentifier, { required: true, maxLength: 35 }, `Ligne ${lineNumber}: ID Ligne (Article)`, itemErrors)) {}
        if (!validateField(itemCode, { required: true, maxLength: 35 }, `Ligne ${lineNumber}: Code Article`, itemErrors)) {}
        if (!validateField(itemDescription, { required: true, maxLength: 500 }, `Ligne ${lineNumber}: Description Article`, itemErrors)) {}
        
        let quantity, unitPriceHT, lineTaxRate;

        // Note: XSD defines quantity as xs:string, but we need to parse it as number for calculations.
        // It's also length-constrained, so using 'monetaryAmount' pattern is a good fit for numerical string.
        if (!validateField(quantityStr, { required: true, type: 'monetaryAmount' }, `Ligne ${lineNumber}: Quantité`, itemErrors)) {
            quantity = 0; // Default to 0 to prevent further calculation errors
        } else {
            quantity = parseFloat(quantityStr);
        }

        if (!validateField(measurementUnit, { required: true, maxLength: 8 }, `Ligne ${lineNumber}: Unité de Mesure`, itemErrors)) {}

        if (!validateField(unitPriceHTStr, { required: true, type: 'monetaryAmount' }, `Ligne ${lineNumber}: Prix Unitaire HT`, itemErrors)) {
            unitPriceHT = 0;
        } else {
            unitPriceHT = parseFloat(unitPriceHTStr);
        }

        if (!validateField(lineTaxTypeCode, { required: true, enum: Array.from(lookupMaps.taxTypeMap.keys()) }, `Ligne ${lineNumber}: Code Type Taxe Ligne`, itemErrors)) {}

        if (!validateField(lineTaxRateStr, { required: true, type: 'number', pattern: /^[0-9]{1,2}(\.[0-9]{1,2})?$/ }, `Ligne ${lineNumber}: Taux de Taxe Ligne`, itemErrors)) {
            lineTaxRate = 0;
        } else {
            lineTaxRate = parseFloat(lineTaxRateStr);
        }

        errors.push(...itemErrors); // Add line-specific errors to the main errors array

        if (itemErrors.length === 0) { // Only calculate if line item is valid
            lineItemCount++;
            const lineNet = quantity * unitPriceHT;
            const lineTaxAmount = lineNet * (lineTaxRate / 100);
            const lineTTC = lineNet + lineTaxAmount;

            totalHT += lineNet;
            totalTaxAmount += lineTaxAmount;

            invoiceData.TEIF.InvoiceBody.LinSection.Lin.push({
                ItemIdentifier: itemIdentifier,
                LinImd: {
                    ItemCode: itemCode,
                    ItemDescription: itemDescription,
                    _attributes: { lang: 'fr' } // Default language
                },
                LinQty: {
                    Quantity: { _value: quantity.toFixed(5), _attributes: { measurementUnit: measurementUnit } } // Quantity formatted to 5 decimal places
                },
                LinTax: {
                    TaxTypeName: { _value: lookupMaps.taxTypeMap.get(lineTaxTypeCode) || '', _attributes: { code: lineTaxTypeCode } },
                    TaxDetails: {
                        TaxRate: lineTaxRate.toFixed(2),
                        TaxRateBasis: lineNet.toFixed(5) // Base for tax calculation
                    }
                },
                LinMoa: {
                    MoaDetails: [
                        {
                            Moa: {
                                Amount: { _value: lineNet.toFixed(5), _attributes: { currencyIdentifier: 'TND' } },
                                _attributes: { currencyCodeList: 'ISO_4217', amountTypeCode: 'I-171' } // Net amount for line
                            }
                        },
                         {
                            Moa: {
                                Amount: { _value: lineTTC.toFixed(5), _attributes: { currencyIdentifier: 'TND' } },
                                _attributes: { currencyCodeList: 'ISO_4217', amountTypeCode: 'I-172' } // TTC amount for line
                            }
                        }
                    ]
                }
            });
        }
    }

    if (lineItemCount === 0 && errors.length === 0) {
        errors.push("Aucune ligne de facture valide détectée. Une facture doit contenir au moins une ligne.");
    }


    // --- Populate Invoice Totals (InvoiceMoa) and InvoiceTax ---
    // These are only added if overall data is structurally sound so far
    if (errors.length === 0) {
        // Total HT
        invoiceData.TEIF.InvoiceBody.InvoiceMoa.AmountDetails.push({
            Moa: {
                Amount: { _value: totalHT.toFixed(5), _attributes: { currencyIdentifier: 'TND' } },
                _attributes: { currencyCodeList: 'ISO_4217', amountTypeCode: 'I-171' }
            }
        });

        // Total TTC (calculated from Total HT + Total Tax)
        const totalTTC = totalHT + totalTaxAmount;
        invoiceData.TEIF.InvoiceBody.InvoiceMoa.AmountDetails.push({
            Moa: {
                Amount: { _value: totalTTC.toFixed(5), _attributes: { currencyIdentifier: 'TND' } },
                _attributes: { currencyCodeList: 'ISO_4217', amountTypeCode: 'I-172' }
            }
        });

        // Invoice Level Tax
        if (invoiceTaxTypeCode && invoiceTaxRate !== undefined) {
             invoiceData.TEIF.InvoiceBody.InvoiceTax.InvoiceTaxDetails.push({
                Tax: {
                    TaxTypeName: { _value: lookupMaps.taxTypeMap.get(invoiceTaxTypeCode) || '', _attributes: { code: invoiceTaxTypeCode } },
                    TaxDetails: { TaxRate: invoiceTaxRate.toFixed(2) }
                },
                AmountDetails: [{
                    Moa: {
                        Amount: { _value: totalTaxAmount.toFixed(5), _attributes: { currencyIdentifier: 'TND' } },
                        _attributes: { currencyCodeList: 'ISO_4217', amountTypeCode: 'I-173' }
                    }
                }]
             });
        } else {
            errors.push("Le code et le taux de la taxe au niveau de la facture sont requis pour le calcul global.");
        }
    }


    return { success: errors.length === 0, errors: errors, invoiceData: invoiceData, rowCount: parsedLineItemData.length };
};

/**
 * Utility function to fetch all lookup tables concurrently.
 */
async function getLookupMaps() {
    const [
        documentTypes, partnerIdentifierTypes, dateFunctions,
        partnerFunctions, taxTypes, paymentTermsTypes,
        paymentMeans, communicationMeans, freeTextSubjects
    ] = await Promise.all([
        Lookup.getDocumentTypes(),
        Lookup.getPartnerIdentifierTypes(),
        Lookup.getDateFunctions(),
        Lookup.getPartnerFunctions(),
        Lookup.getTaxTypes(),
        Lookup.getPaymentTermsTypes(),
        Lookup.getPaymentMeans(),
        Lookup.getCommunicationMeans(),
        Lookup.getFreeTextSubjects()
    ]);

    return {
        documentTypeMap: new Map(documentTypes.map(item => [item.code, item.description])),
        partnerIdentifierTypeMap: new Map(partnerIdentifierTypes.map(item => [item.code, item.description])),
        dateFunctionMap: new Map(dateFunctions.map(item => [item.code, item.description])),
        partnerFunctionMap: new Map(partnerFunctions.map(item => [item.code, item.description])),
        taxTypeMap: new Map(taxTypes.map(item => [item.code, item.description])),
        paymentTermsTypeMap: new Map(paymentTermsTypes.map(item => [item.code, item.description])),
        paymentMeansMap: new Map(paymentMeans.map(item => [item.code, item.description])),
        communicationMeansMap: new Map(communicationMeans.map(item => [item.code, item.description])),
        freeTextSubjectsMap: new Map(freeTextSubjects.map(item => [item.code, item.description]))
    };
}


/**
 * Endpoint for validating pasted Excel data without generating XML.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.validateExcelData = async (req, res) => {
    const userId = req.userId;
    const { companyId, pastedData } = req.body;
    let errors = [];

    try {
        if (!companyId || !pastedData) {
            errors.push('Company ID et données collées sont requis pour la validation.');
            return res.status(400).json({ success: false, message: 'Données manquantes.', errors: errors });
        }

        const selectedCompany = await Company.findByIdAndUserId(companyId, userId);
        if (!selectedCompany) {
            errors.push('Entreprise sélectionnée introuvable ou non autorisée.');
            return res.status(404).json({ success: false, message: 'Erreur d\'entreprise.', errors: errors });
        }

        // Attempt to parse first to catch fundamental structure issues
        const { parsedHeaderData, parsedLineItemData } = await parsePastedExcelData(pastedData);
        if (parsedHeaderData.length === 0 && parsedLineItemData.length === 0) {
             errors.push("Aucune donnée d'en-tête ou de ligne de facture valide détectée.");
        }

        // Call the shared validation logic
        const validationResult = await validateInvoiceData({ parsedHeaderData, parsedLineItemData }, selectedCompany);

        if (validationResult.success) {
            res.status(200).json({
                success: true,
                message: 'Validation des données réussie.',
                rowCount: validationResult.rowCount,
                errors: []
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Des erreurs de validation ont été trouvées dans vos données.',
                errors: validationResult.errors
            });
        }

    } catch (error) {
        console.error('Error in validateExcelData controller:', error);
        errors.push(`Erreur interne du serveur lors de la validation: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error during validation', errors: errors });
    }
};


/**
 * Main XML generation function.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.generateXmlInvoice = async (req, res) => {
    const userId = req.userId;
    const { companyId, pastedData } = req.body;
    let errors = [];

    try {
        if (!companyId || !pastedData) {
            errors.push('Company ID et données collées sont requis.');
            return res.status(400).json({ success: false, message: 'Données manquantes.', errors: errors });
        }

        const selectedCompany = await Company.findByIdAndUserId(companyId, userId);
        if (!selectedCompany) {
            errors.push('Entreprise sélectionnée introuvable ou non autorisée.');
            return res.status(404).json({ success: false, message: 'Erreur d\'entreprise.', errors: errors });
        }

        const { parsedHeaderData, parsedLineItemData } = await parsePastedExcelData(pastedData);

        // Re-use the validation logic
        const validationResult = await validateInvoiceData({ parsedHeaderData, parsedLineItemData }, selectedCompany);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Des erreurs de validation ont été trouvées dans vos données.',
                errors: validationResult.errors
            });
        }

        // If validation passed, build XML using the already structured data
        const invoice = validationResult.invoiceData;
        const root = create({ version: '1.0', encoding: 'UTF-8' }, invoice);
        const xmlString = root.end({ prettyPrint: true });

        const fileName = `invoice_${invoice.TEIF.InvoiceBody.Bgm.DocumentIdentifier}_${Date.now()}.xml`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.status(200).send(xmlString);

    } catch (error) {
        console.error('Error in generateXmlInvoice controller:', error);
        errors.push(`Erreur interne du serveur: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error during XML generation', errors: errors });
    }
};
