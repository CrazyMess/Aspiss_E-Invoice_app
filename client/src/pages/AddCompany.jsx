import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom"; // Use react-router-dom Link and useNavigate
import axios from "axios"; // Import axios

// Import UI components
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Import Lucide React icons
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BUTTON_SIZE_DEFAULT,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

const AddCompany = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the 'id' parameter from the URL
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    taxIdTypeCode: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Tunisia",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({}); // Client-side validation errors
  const [isLoading, setIsLoading] = useState(false); // For API call loading state
  const [apiSuccess, setApiSuccess] = useState(null); // API success message
  const [apiError, setApiError] = useState(null); // API error message
  const [partnerIdentifierTypes, setPartnerIdentifierTypes] = useState([]);

  // Fetch company data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setApiError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch Partner Identifier Types first
        const typesResponse = await axios.get(
          "http://localhost:3000/api/lookups/partner-identifier-types"
        );
        setPartnerIdentifierTypes(typesResponse.data);

        // Set a default taxIdTypeCode if adding a new company, or if no types are returned
        // Or, if editing, wait for company data to set it
        if (!isEditMode && typesResponse.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            taxIdTypeCode: typesResponse.data[0].code,
          }));
        }

        // Fetch company data if in edit mode
        if (isEditMode) {
          const companyResponse = await axios.get(
            `http://localhost:3000/api/companies/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const companyData = companyResponse.data;

          // Map backend snake_case to frontend camelCase for form population
          setFormData({
            name: companyData.name || "",
            taxId: companyData.tax_id || "",
            taxIdTypeCode:
              companyData.tax_id_type_code ||
              (typesResponse.data.length > 0 ? typesResponse.data[0].code : ""),
            address: companyData.address || "",
            city: companyData.city || "",
            postalCode: companyData.postal_code || "",
            country: companyData.country || "Tunisia",
            email: companyData.email || "",
            phone: companyData.phone || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch company data for edit:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
        setApiError(
          err.response?.data?.message ||
            "Erreur lors du chargement des informations de l'entreprise."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate]); // Re-run effect if id changes or if in edit mode

  const validateTaxId = (taxId) => {
    // Only validate if taxIdTypeCode is "I-01" (Tunisian Fiscal Matricule) and then it must be 13 digits
    // Otherwise, for other types, we might have different rules, so we'll just allow anything for now if not I-01
    if (formData.taxIdTypeCode === "I-01") {
      return taxId.length === 13 && /^\d+$/.test(taxId);
    }
    // For other types, tax ID is not strictly validated for length/digits, but it shouldn't be empty if taxIdTypeCode is selected.
    return taxId.trim() !== "";
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    const newErrors = { ...errors };

    // Real-time validation for name
    if (field === "name") {
      if (value.trim().length < 2) {
        newErrors.name = "Le nom de l'entreprise doit contenir au moins 2 caractères";
      } else {
        delete newErrors.name;
      }
    }

    // Only re-validate taxId if it's the field being changed or if taxIdTypeCode just changed
    if (field === "taxId" || field === "taxIdTypeCode") {
      if (formData.taxIdTypeCode === "I-01") { // Re-check specifically for I-01
          if (!value.trim() || !validateTaxId(value)) {
              newErrors.taxId = "Le numéro fiscal (13 chiffres) est requis pour ce type d'identifiant.";
          } else {
              delete newErrors.taxId;
          }
      } else if (value.trim() === "") { // For other types, tax ID can't be empty if type selected
          newErrors.taxId = "Le numéro d'identification est requis pour ce type d'identifiant.";
      } else {
          delete newErrors.taxId;
      }
  }

    setErrors(newErrors);
    setApiError(null); 
    setApiSuccess(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

     // Full form validation before API call
     const finalErrors = {};
     if (!formData.name.trim()) finalErrors.name = "Le nom de l'entreprise est requis.";
     if (!formData.taxIdTypeCode.trim()) finalErrors.taxIdTypeCode = "Le type d'identifiant fiscal est requis.";
     if (!formData.taxId.trim() || !validateTaxId(formData.taxId)) finalErrors.taxId = "Le numéro fiscal est requis et doit être valide.";
     if (!formData.address.trim()) finalErrors.address = "L'adresse est requise.";
     if (!formData.city.trim()) finalErrors.city = "La ville est requise.";
     if (!formData.postalCode.trim()) finalErrors.postalCode = "Le code postal est requis.";
     if (!formData.country.trim()) finalErrors.country = "Le pays est requis.";

    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      let response;
      const payload = {
        name: formData.name,
        taxId: formData.taxId,
        taxIdTypeCode: formData.taxIdTypeCode,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        email: formData.email,
        phone: formData.phone,
      };

      if (isEditMode) {
        response = await axios.put(
          `http://localhost:3000/api/companies/${id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await axios.post(
          "http://localhost:3000/api/companies",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setApiSuccess(
        response.data.message ||
          (isEditMode
            ? "Entreprise mise à jour avec succès !"
            : "Entreprise ajoutée avec succès !")
      );
      console.log("Company operation successful:", response.data);

      // Redirect after success
      setTimeout(() => {
        navigate("/companies");
      }, 2000);

    } catch (err) {
      console.error("Error submitting company:", err);
      setApiError(
        err.response?.data?.message ||
          "Une erreur inattendue est survenue lors de l'opération."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check form validity based on all required fields and no validation errors
  const isFormValid =
    formData.name.trim() !== "" &&
    formData.taxIdTypeCode.trim() !== "" && // taxIdTypeCode must be selected
    formData.taxId.trim() !== "" && validateTaxId(formData.taxId) &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.postalCode.trim() !== "" &&
    formData.country.trim() !== "" &&
    Object.keys(errors).length === 0;

  // Render loading state for initial fetch in edit mode
  if (isEditMode && isLoading && !apiError) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">
          Chargement des informations de l'entreprise...
        </p>
      </div>
    );
  }

  if (apiSuccess && !isEditMode) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Entreprise ajoutée avec succès !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre entreprise a été configurée et est prête pour la génération
              de factures XML.
            </p>
            <div className="space-x-4">
              <Link to="/companies">
                <Button variant="outline">Voir mes entreprises</Button>
              </Link>
              <Link to="/generate">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Générer des factures
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux entreprises
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Ajouter une nouvelle entreprise
        </h1>
        <p className="text-gray-600 mt-2">
          Remplissez les informations de votre entreprise pour générer des
          factures XML conformes
        </p>
      </div>

      {/* API Success/Error Messages */}
      {apiSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {apiSuccess}
          </AlertDescription>
        </Alert>
      )}
      {apiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'entreprise</CardTitle>
          <CardDescription>
            Toutes les informations sont requises pour assurer la conformité TTN
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Ex: Tech Solutions SARL"
                required
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Tax ID Type Code (Dropdown) */}
            <div>
            <Label htmlFor="taxIdTypeCode">Type d'identifiant fiscal *</Label>
                <Select
                  value={formData.taxIdTypeCode}
                  onValueChange={(value) => handleInputChange("taxIdTypeCode", value)}
                >
                  <SelectTrigger className={errors.taxIdTypeCode ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionnez le type d'identifiant" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerIdentifierTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.description} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.taxIdTypeCode && <p className="text-sm text-red-600 mt-1">{errors.taxIdTypeCode}</p>}
            </div>

            {/* Tax ID  */}
            <div>
              <Label htmlFor="taxId">Numéro fiscal *</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                className={errors.taxId ? "border-red-500" : ""}
                placeholder="1234567890123 (13 chiffres)"
                maxLength={13}
                required
              />
              {errors.taxId && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  {errors.taxId}
                </div>
              )}
              {formData.taxId &&
                !errors.taxId &&
                validateTaxId(formData.taxId) && (
                  <div className="flex items-center mt-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Numéro fiscal valide
                  </div>
                )}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
                placeholder="Ex: 123 Avenue Habib Bourguiba"
                required
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address}</p>
              )}
            </div>

            {/* City and Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                  placeholder="Ex: Tunis"
                  required
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  className={errors.postalCode ? "border-red-500" : ""}
                  placeholder="Ex: 1000"
                  required
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.postalCode}
                  </p>
                )}
              </div>
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className={errors.country ? "border-red-500" : ""}
                placeholder="Tunisie"
                required
              />
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <Label htmlFor="email">Email de l'entreprise (Optionnel)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contact@entreprise.com"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <Label htmlFor="phone">
                Téléphone de l'entreprise (Optionnel)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Vérifiez que toutes les informations
                sont exactes. Elles seront utilisées pour générer vos factures
                XML conformes aux standards TTN.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4">
              <Button
                type="submit"
                className={cn(
                  BUTTON_SIZE_DEFAULT,
                  BUTTON_VARIANT_DEFAULT,
                  "bg-blue-600 hover:bg-blue-700"
                )}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? "Mise à jour..." : "Enregistrement..."}
                  </>
                ) : isEditMode ? (
                  "Mettre à jour l'entreprise"
                ) : (
                  "Enregistrer l'entreprise"
                )}
              </Button>
              <Link to="/companies">
                <Button
                  variant="outline"
                  className={cn(BUTTON_SIZE_DEFAULT, BUTTON_VARIANT_OUTLINE)}
                >
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCompany;
