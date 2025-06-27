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
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert"; // Import AlertTitle
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";

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

  const countries = [
    { value: "Tunisia", label: "Tunisie" },
    { value: "France", label: "France" },
    { value: "Canada", label: "Canada" },
    { value: "USA", label: "États-Unis" },
    { value: "Morocco", label: "Maroc" },
    { value: "Algeria", label: "Algérie" },
  ];

  useEffect(() => {
    // Fetch existing billing info on component mount
    const fetchBillingInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect if not authenticated
        return;
      }
      try {
        const response = await axios.get(
          "http://localhost:3000/api/user/billing-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const billingInfo = response.data.billingInfo;
        setFormData({
          billingEntityName: billingInfo.billing_entity_name || "",
          billingTaxId: billingInfo.billing_tax_id || "",
          address: billingInfo.address || "",
          city: billingInfo.city || "",
          postalCode: billingInfo.postal_code || "",
          country: billingInfo.country || "Tunisia",
        });
        setIsEditMode(true); // Billing info exists, so we are in edit mode
      } catch (err) {
        // If 404, it means no billing info exists, so stay in create mode
        if (err.response && err.response.status === 404) {
          setIsEditMode(false);
        } else if (err.response && err.response.stutus === 401) {
          navigate("/login"); // Token invalid or expired
        } else {
          setApiError(
            err.response?.data?.message ||
              "Erreur lors du chargement des informations de facturation."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingInfo();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitStatus("idle"); // Reset submit status on input change
    setApiError(null); // Clear API error on input change
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.billingEntityName.trim()) {
      newErrors.billingEntityName =
        "Le nom de l'entité de facturation est requis";
    }
    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est requise";
    }
    if (!formData.city.trim()) {
      newErrors.city = "La ville est requise";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Le code postal est requis";
    }
    if (!formData.country) {
      newErrors.country = "Le pays est requis";
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
        billingEntityName: formData.billingEntityName,
        billingTaxId: formData.billingTaxId,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
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
      }

      setSubmitStatus("success");
      console.log("Billing info submitted successfully:", response.data);

      // After success, we might want to update the user info in local storage
      // This is a simplified approach; in a real app, you might re-fetch user data.
      // TODO: re-fetch user data and update local storage
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({ ...currentUser, hasBillingInfo: true })
        );
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
          facturation sont chiffrées et sécurisées selon les standards
          bancaires.
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

            {/* Tax ID (Optional) */}
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
                placeholder="Numéro fiscal de votre entreprise"
              />
              <p className="text-xs text-gray-500 mt-1">
                Requis uniquement pour les entreprises soumises à la TVA
              </p>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input // Using Input for now as V0 had 'text' input. Change to textarea for multiline if needed.
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
                placeholder="Adresse complète"
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
