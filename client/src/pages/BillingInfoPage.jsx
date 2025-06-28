// BillingInfoPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Importing the necessary components
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
} from "../components/ui/select.jsx";

// Importing the necessary icons
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BUTTON_SIZE_DEFAULT,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

const BillingInfoPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    billingEntityName: "",
    billingTaxId: "",
    billingTaxIdType: "I-01", // Default to Tunisian Fiscal ID
    address: "",
    city: "",
    postalCode: "",
    country: "Tunisia", // Default country
  });

  const [isEditMode, setIsEditMode] = useState(false); // to determine if we're creating or updating billing info
  const [isLoading, setIsLoading] = useState(true); // Initial loading for fetching existing data
  const [submitStatus, setSubmitStatus] = useState("idle"); // "idle" | "success" | "error"
  const [errors, setErrors] = useState({}); // Client-side validation errors
  const [apiError, setApiError] = useState(null); // Backend API errors
  const [taxIdTypes, setTaxIdTypes] = useState([]); // State for fetched tax ID types

  const countries = [
    { value: "Tunisia", label: "Tunisie" },
    { value: "France", label: "France" },
    { value: "Canada", label: "Canada" },
    { value: "USA", label: "États-Unis" },
    { value: "Morocco", label: "Maroc" },
    { value: "Algeria", label: "Algérie" },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect if not authenticated
        return;
      }

      try {
        // Fetch billing info
        const billingInfoResponse = await axios.get(
          "http://localhost:3000/api/user/billing-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const billingInfo = billingInfoResponse.data.billingInfo;
        setFormData({
          billingEntityName: billingInfo.billing_entity_name || "",
          billingTaxId: billingInfo.billing_tax_id || "",
          billingTaxIdType: billingInfo.billing_tax_id_type || "I-01", // Default or fetched
          address: billingInfo.address || "",
          city: billingInfo.city || "",
          postalCode: billingInfo.postal_code || "",
          country: billingInfo.country || "Tunisia",
        });
        setIsEditMode(true); // Billing info exists, so we are in edit mode

        // Fetch tax ID types lookup (can be done concurrently or sequentially)
        const taxIdTypesResponse = await axios.get(
          "http://localhost:3000/api/lookups/partner-identifier-types" // Assuming this endpoint exists
        );
        setTaxIdTypes(taxIdTypesResponse.data);

      } catch (err) {
        if (err.response && err.response.status === 404) {
          setIsEditMode(false); // No billing info found, stay in create mode
        } else if (err.response && err.response.status === 401) {
          navigate("/login"); // Token invalid or expired
        } else {
          setApiError(
            err.response?.data?.message ||
              "Erreur lors du chargement des informations de facturation."
          );
        }
        // Still try to fetch taxIdTypes even if billing info fetch fails
        try {
            const taxIdTypesResponse = await axios.get(
                "http://localhost:3000/api/lookups/partner-identifier-types"
            );
            setTaxIdTypes(taxIdTypesResponse.data);
        } catch (lookupErr) {
            console.error("Error fetching tax ID types:", lookupErr);
            setApiError(prev => prev + " Erreur lors du chargement des types d'identifiants fiscaux.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing for that specific field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitStatus("idle"); // Reset submit status on input change
    setApiError(null); // Clear API error on input change
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.billingEntityName.trim()) {
      newErrors.billingEntityName = "Le nom de l'entité de facturation est requis.";
    } else if (formData.billingEntityName.trim().length > 200) {
      newErrors.billingEntityName = "Le nom ne doit pas dépasser 200 caractères.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est requise.";
    } else if (formData.address.trim().length > 500) {
      newErrors.address = "L'adresse ne doit pas dépasser 500 caractères.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "La ville est requise.";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Le code postal est requis.";
    } else if (!/^\d{4,17}$/.test(formData.postalCode.trim())) { // Basic numeric, max 17 digits
        newErrors.postalCode = "Le code postal doit être numérique et valide (max 17 chiffres).";
    }

    if (!formData.country) {
      newErrors.country = "Le pays est requis.";
    }

    // Validate billingTaxId and billingTaxIdType only if one is provided
    if (formData.billingTaxId.trim() || formData.billingTaxIdType.trim()) {
        if (!formData.billingTaxId.trim()) {
            newErrors.billingTaxId = "Le numéro d'identification fiscale est requis si un type est sélectionné.";
        }
        if (!formData.billingTaxIdType.trim()) {
            newErrors.billingTaxIdType = "Le type d'identification fiscale est requis si un numéro est fourni.";
        }

        // Specific regex validation based on type, align with backend rules
        if (formData.billingTaxId.trim() && formData.billingTaxIdType.trim()) {
            const taxIdValue = formData.billingTaxId.trim();
            const taxIdType = formData.billingTaxIdType.trim();

            switch (taxIdType) {
                case 'I-01': // Tunisian Fiscal ID (Matricule Fiscal)
                    // Allows 7 digits + letter + 3 digits (e.g., 1234567A001) or 7-13 digits
                    if (!/^(?:[0-9]{7}[A-Z][0-9]{3}|[0-9]{7,13})$/i.test(taxIdValue)) {
                        newErrors.billingTaxId = "Format MF tunisien invalide. Attendu: 7 chiffres + 1 lettre + 3 chiffres (Ex: 1234567A001) OU 7 à 13 chiffres.";
                    } else if (taxIdValue.length > 35) { // Max length for XML
                        newErrors.billingTaxId = "Le numéro d'identification fiscale ne doit pas dépasser 35 caractères.";
                    }
                    break;
                case 'I-02': // CIN
                    if (!/^[0-9]{8}$/.test(taxIdValue)) {
                        newErrors.billingTaxId = "Le CIN doit être composé de 8 chiffres.";
                    } else if (taxIdValue.length > 35) {
                         newErrors.billingTaxId = "Le numéro d'identification fiscale ne doit pas dépasser 35 caractères.";
                    }
                    break;
                case 'I-03': // Carte de séjour
                    if (!/^[0-9]{9}$/.test(taxIdValue)) {
                        newErrors.billingTaxId = "La Carte de Séjour doit être composée de 9 chiffres.";
                    } else if (taxIdValue.length > 35) {
                        newErrors.billingTaxId = "Le numéro d'identification fiscale ne doit pas dépasser 35 caractères.";
                    }
                    break;
                // Add more cases for other tax ID types if necessary (e.g., I-04 for non-Tunisian MF)
                default:
                    // Generic max length check for unknown types, or add specific rules if needed
                    if (taxIdValue.length > 35) {
                        newErrors.billingTaxId = "Le numéro d'identification fiscale ne doit pas dépasser 35 caractères.";
                    }
                    break;
            }
        }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus("error"); // Indicate form validation failed
      return;
    }

    setIsLoading(true);
    setSubmitStatus("idle");
    setApiError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      let response;
      const apiUrl = "http://localhost:3000/api/user/billing-info";
      const payload = {
        billing_entity_name: formData.billingEntityName, // Match backend field names
        billing_tax_id: formData.billingTaxId, // Match backend field names
        billing_tax_id_type: formData.billingTaxIdType, // Match backend field names
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
      };

      if (isEditMode) {
        response = await axios.put(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await axios.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsEditMode(true); // After a successful POST, switch to edit mode
      }

      setSubmitStatus("success");
      console.log("Billing info submitted successfully:", response.data);
      try {
        const userResponse = await axios.get("http://localhost:3000/api/user/billing-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        localStorage.setItem("user", JSON.stringify(userResponse.data.user));
        console.log("User data re-fetched and local storage updated.");
      } catch (userFetchError) {
        console.error("Failed to re-fetch user data:", userFetchError);
        // This is not critical for billing info submission success, but log it
      } 

      setTimeout(() => {
        navigate("/subscription"); // Redirect to subscription page after success
      }, 2000);
    } catch (err) {
      setSubmitStatus("error");
      console.error("Error submitting billing info:", err);
      setApiError(
        err.response?.data?.message || "Une erreur inattendue est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">
          Chargement des informations de facturation...
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/subscription"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux abonnements
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Mes Informations de Facturation
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les détails utilisés pour vos paiements d'abonnement.
        </p>
      </div>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Sécurité garantie:</strong> Toutes vos informations de
          facturation et d'identification fiscale sont chiffrées et sécurisées
          selon les standards bancaires.
        </AlertDescription>
      </Alert>

      {/* API Error Message */}
      {apiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {submitStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Informations enregistrées avec succès !</strong> Vous allez
            être redirigé vers la page des abonnements.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Validation Error Message */}
      {submitStatus === "error" &&
        apiError === null &&
        Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Veuillez corriger les erreurs</AlertTitle>
            <AlertDescription>
              Certains champs requis sont manquants ou invalides.
            </AlertDescription>
          </Alert>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Informations de Facturation
          </CardTitle>
          <CardDescription>
            Ces informations apparaîtront sur vos factures d'abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Billing Entity Name */}
            <div>
              <Label htmlFor="billingEntityName">
                Nom de l'entité de facturation *
              </Label>
              <Input
                id="billingEntityName"
                value={formData.billingEntityName}
                onChange={(e) =>
                  handleInputChange("billingEntityName", e.target.value)
                }
                className={errors.billingEntityName ? "border-red-500" : ""}
                placeholder="Nom de votre entreprise ou nom personnel"
                required
              />
              {errors.billingEntityName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.billingEntityName}
                </p>
              )}
            </div>

            {/* Tax ID and Tax ID Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingTaxIdType">Type d'identification fiscale (Optionnel)</Label>
                <Select
                  value={formData.billingTaxIdType}
                  onValueChange={(value) => handleInputChange("billingTaxIdType", value)}
                >
                  <SelectTrigger
                    className={errors.billingTaxIdType ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxIdTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.code}: {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.billingTaxIdType && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.billingTaxIdType}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="billingTaxId">
                  Numéro d'identification fiscale (Optionnel)
                </Label>
                <Input
                  id="billingTaxId"
                  value={formData.billingTaxId}
                  onChange={(e) =>
                    handleInputChange("billingTaxId", e.target.value)
                  }
                  className={errors.billingTaxId ? "border-red-500" : ""}
                  placeholder="Numéro fiscal de votre entreprise ou CIN"
                />
                {errors.billingTaxId && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.billingTaxId}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Requis si vous avez un numéro d'identification fiscale pour la facturation.
                </p>
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input // Consider changing to textarea if multiline addresses are common
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
                placeholder="Adresse complète (ex: Rue Principale, Appart 123)"
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
                  placeholder="Ville"
                  required
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="postalCode">Code Postal *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  className={errors.postalCode ? "border-red-500" : ""}
                  placeholder="Code postal"
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
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange("country", value)}
              >
                <SelectTrigger
                  className={errors.country ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country}</p>
              )}
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ces informations seront utilisées uniquement pour la facturation
                de votre abonnement. Elles ne seront pas partagées avec des
                tiers.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                className={cn(BUTTON_VARIANT_DEFAULT,BUTTON_SIZE_DEFAULT,"bg-blue-600 hover:bg-blue-700")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : isEditMode ? (
                  "Mettre à jour les informations de facturation"
                ) : (
                  "Enregistrer les informations de facturation"
                )}
              </Button>
              <Link to="/subscription">
                <Button
                  className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_DEFAULT)}
                >
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Que se passe-t-il ensuite ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Vos informations de facturation seront vérifiées automatiquement</span>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Vous pourrez ensuite souscrire à un plan payant</span>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>Les factures seront automatiquement générées chaque mois</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingInfoPage;