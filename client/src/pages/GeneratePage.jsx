import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Import UI components
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";
import { Input } from "../components/ui/Input"; // For DataEntryScreen's textarea

// Import Lucide React icons
import {
  Building2,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Copy,
  Upload,
  ArrowLeft,
  Loader2,
  Download, // For loading spinners
} from "lucide-react";

// Utility function to combine class names
import { cn } from "../lib/utils";
import {
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_GHOST,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

// DataEntryScreen component
function DataEntryScreen({ selectedCompany, setStep }) {
  const navigate = useNavigate();
  const [pastedData, setPastedData] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null); // { isValid: boolean, rowCount: number, errors: [] }
  const [generatingXml, setGeneratingXml] = useState(false);
  const [generationResult, setGenerationResult] = useState(null); // { success: boolean, message: string, downloadLink: string, errors: [] }
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDataPaste = (e) => {
    const data = e.target.value;
    setPastedData(data);
    setValidationResults(null); // Clear previous validation results
    setGenerationResult(null); // Clear previous generation results

    if (data.trim()) {
      setIsValidating(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Call the backend validation endpoint
        const response = axios.post('http://localhost:3000/api/generate/validate-excel', {
          companyId: selectedCompany.id,
            pastedData: data,
        }, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        // Set validation results based on backend response
        setValidationResults({
          isValid: response.data.success,
          rowCount: response.data.rowCount,
          errors: response.data.errors || []
      });
      } catch (err) {
        console.error("Error during data validation:", err);
          // Handle validation errors returned by the backend
          const errorData = err.response?.data;
          setValidationResults({
              isValid: false,
              rowCount: 0,
              errors: errorData?.errors || [errorData?.message || 'Erreur inconnue lors de la validation.']
          });
      } finally {
        setIsValidating(false); 
      }
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Make GET request to the backend for the Excel template
      const response = await axios.get(`http://localhost:3000/api/generate/template?companyId=${selectedCompany.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob', // Important: to handle binary data (file download)
      });

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Facture_Template_${selectedCompany.name.replace(/\s/g, '_')}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the object URL

    } catch (err) {
      console.error("Error downloading Excel template:", err);
      // Provide user feedback for download error
      setGenerationResult({
          success: false,
          message: err.response?.data?.message || 'Erreur lors du téléchargement du modèle Excel. Veuillez réessayer.'
      });
    } finally {
      setDownloadingTemplate(false);
    }
  }

  const handleGenerateXml = async () => {
    setGeneratingXml(true);
    setGenerationResult(null); // Clear previous results

    // Placeholder for actual backend XML generation API call
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Send pastedData and SelectedCompany.id to backend for XML generation
      const response = await axios.post('http://localhost:3000/api/generate/xml', {
            companyId: selectedCompany.id,
            pastedData: pastedData,
      }, {
            headers: { 'Authorization': `Bearer ${token}` },
            responseType: 'blob' // Expecting XML or ZIP file as response
      });
      
      // Assuming the backend returns a single XML file for now
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `facture_${selectedCompany.name.replace(/\s/g, '_')}_${Date.now()}.xml`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1];
        }
    }

        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setGenerationResult({ success: true, message: "Fichier(s) XML généré(s) et téléchargé(s) avec succès !" });
      
    } catch (err) {
      console.error("Error during XML generation:", err);
        // Handle server-side validation errors from XML generation
        let errorMessage = 'Une erreur inattendue est survenue lors de la génération XML.';
        let errors = [];

        if (err.response && err.response.data) {
            // If the error response is a blob, try to read it as text/JSON
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const errorJson = JSON.parse(reader.result);
                    errorMessage = errorJson.message || errorMessage;
                    errors = errorJson.errors || [];
                } catch (parseError) {
                    // Fallback if parsing fails (e.g., non-JSON error response)
                    errorMessage = reader.result.toString() || errorMessage;
                    console.error("Failed to parse error response:", parseError);
                }
                setGenerationResult({ success: false, message: errorMessage, errors: errors });
            };
            reader.readAsText(err.response.data);
        } else {
             setGenerationResult({ success: false, message: err.message || errorMessage });
        }
    } finally {
      setGeneratingXml(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center mb-4">
          <Button
            onClick={() => setStep(1)}
            className={cn(
              BUTTON_SIZE_DEFAULT,
              BUTTON_VARIANT_GHOST,
              "text-blue-600 hover:text-blue-700"
            )}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Changer d'entreprise
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Collez vos données de facture ici pour{" "}
          <span className="text-blue-600">{selectedCompany?.name}</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Suivez les étapes ci-dessous pour importer vos données Excel
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
            Instructions d'import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                1. Préparez votre fichier Excel
              </h3>
              <p className="text-sm text-gray-600">
                Organisez vos données avec les colonnes requises
              </p>
              <Button
                className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_SM, "mt-2")}
                onClick={() => handleDownloadTemplate()}
                disabled={downloadingTemplate}
              >
                {downloadingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger modèle
                    </>
                  )}
              </Button>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Copy className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                2. Copiez vos données
              </h3>
              <p className="text-sm text-gray-600">
                Sélectionnez et copiez toutes vos données depuis Excel
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                3. Collez ici
              </h3>
              <p className="text-sm text-gray-600">
                Collez vos données dans la zone ci-dessous
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Input Area */}
      <Card>
        <CardHeader>
          <CardTitle>Zone de saisie des données</CardTitle>
          <CardDescription>
            Collez vos données Excel ici. La validation se fera automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Collez vos données Excel ici...&#10;&#10;Exemple:&#10;Numéro Facture Date  Client  Montant HT  TVA Total TTC&#10;FAC001  2024-01-15  Client A  100.000 19.000  119.000&#10;FAC002  2024-01-16  Client B  200.000 38.000  238.000"
              value={pastedData}
              onChange={handleDataPaste}
            />

            {isValidating && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Validation des données en cours...
                </AlertDescription>
              </Alert>
            )}

            {validationResults && validationResults.isValid && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Validation réussie!</strong>{" "}
                  {validationResults.rowCount} lignes de données détectées.
                </AlertDescription>
              </Alert>
            )}

            {validationResults &&
              !validationResults.isValid &&
              validationResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreurs de validation des données</AlertTitle>
                  <AlertDescription>
                    Veuillez corriger les erreurs suivantes :
                    <ul className="list-disc list-inside mt-2">
                      {validationResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons for Data Entry */}
      <div className="flex justify-between flex-col sm:flex-row gap-4">
        <Button
          className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_DEFAULT)}
          onClick={() => setStep(1)}
        >
          Annuler
        </Button>{" "}
        {/* Back to company selection */}
        <Button
          className={cn(
            BUTTON_SIZE_DEFAULT,
            BUTTON_VARIANT_DEFAULT,
            "bg-blue-600 hover:bg-blue-700"
          )}
          disabled={!validationResults?.isValid || generatingXml}
          onClick={handleGenerateXml}
        >
          {generatingXml ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération XML...
            </>
          ) : (
            <>
              Générer les factures XML
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* XML Generation Results */}
      {generationResult && generationResult.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Génération XML réussie !</AlertTitle>
          <AlertDescription className="text-green-800">
            {generationResult.message}
            {generationResult.downloadLink && (
              <p className="mt-2">
                <a
                  href={generationResult.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline text-blue-700"
                >
                  Cliquez ici pour télécharger vos fichiers.
                </a>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      {generationResult && !generationResult.success && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de génération XML</AlertTitle>
          <AlertDescription>
            {generationResult.message}
            {generationResult.errors && generationResult.errors.length > 0 && (
              <ul className="list-disc list-inside mt-2">
                {generationResult.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

const GeneratePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To read query params
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState(null); // Stores full company object
  const [step, setStep] = useState(1); // 1: Select Company, 2: Data Entry
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  useEffect(() => {
    // Check if companyId is passed via URL query parameter (e.g., /generate?company=...)
    const queryParams = new URLSearchParams(location.search);
    const companyIdFromUrl = queryParams.get("company");

    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      setCompaniesError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:3000/api/companies",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const fetchedCompanies = response.data.map(company => ({
          id: company.company_id,
          name: company.name,
          taxId: company.tax_id,
          city: company.city,
          address: company.address, // Added for pre-filling template
          postal_code: company.postal_code, // Added for pre-filling template
          country: company.country, // Added for pre-filling template
          email: company.email, // Added for pre-filling template
          phone: company.phone, // Added for pre-filling template
          taxIdTypeCode: company.tax_id_type_code, // Added for pre-filling template
          // Add other company details that might be needed for the template later
        }));
        setCompanies(fetchedCompanies);

        if (companyIdFromUrl) {
          const preSelected = fetchedCompanies.find(
            (c) => c.id === companyIdFromUrl
          );
          if (preSelected) {
            setSelectedCompanyId(preSelected.id);
            setSelectedCompanyDetails(preSelected);
            setStep(2); // Go directly to data entry if company selected from URL
          }
        }
      } catch (err) {
        console.error("Failed to fetch companies for generate page:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
        setCompaniesError(
          err.response?.data?.message ||
            "Erreur lors du chargement des entreprises."
        );
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [location.search, navigate]);

  const handleCompanySelectChange = (value) => {
    setSelectedCompanyId(value);
    const company = companies.find((c) => c.id === value);
    setSelectedCompanyDetails(company);
  };

  const handleContinue = () => {
    if (selectedCompanyId && selectedCompanyDetails) {
      setStep(2);
    }
  };

  // Render loading state for companies
  if (loadingCompanies) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Chargement des entreprises...</p>
      </div>
    );
  }

  // Render DataEntryScreen if step is 2
  if (step === 2) {
    return (
      <DataEntryScreen
        selectedCompany={selectedCompanyDetails}
        setStep={setStep}
      />
    );
  }

  // Render initial company selection screen
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Générer des factures XML</h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez l'entreprise pour laquelle vous souhaitez générer des factures
          </p>
        </div>

        {/* Company Selection */}
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Pour quelle entreprise souhaitez-vous générer des factures ?
            </CardTitle>
            <CardDescription>Choisissez une entreprise configurée ou ajoutez-en une nouvelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {companiesError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>{companiesError}</AlertDescription>
              </Alert>
            ) : companies.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vous n'avez pas encore configuré d'entreprises.
                  <Link to="/companies/add" className="font-medium text-blue-600 hover:underline ml-1">
                    Veuillez ajouter une nouvelle entreprise
                  </Link>
                  pour commencer.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une entreprise</label>
                  <Select value={selectedCompanyId} onValueChange={handleCompanySelectChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisissez une entreprise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-sm text-gray-500">
                                {company.taxId} • {company.city}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompanyId && selectedCompanyDetails && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Entreprise sélectionnée:</strong> {selectedCompanyDetails.name}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedCompanyId}
                    className={cn(BUTTON_SIZE_DEFAULT,BUTTON_VARIANT_DEFAULT,"bg-blue-600 hover:bg-blue-700 flex-1")}
                  >
                    Continuer avec cette entreprise
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link to="/companies/add" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une nouvelle entreprise
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="text-lg">Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Préparez vos données Excel</h4>
                  <p className="text-sm text-gray-600">Organisez vos données de facturation dans un fichier Excel</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Copiez et collez vos données</h4>
                  <p className="text-sm text-gray-600">Sélectionnez et copiez toutes vos données depuis Excel</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Téléchargez vos fichiers XML</h4>
                  <p className="text-sm text-gray-600">Obtenez vos fichiers XML conformes TTN</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default GeneratePage;
