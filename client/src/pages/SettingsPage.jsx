import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";

// Import Lucide React icons
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_GHOST,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

const SettingsPage = () => {
  const navigate = useNavigate();

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [personalInfoLoading, setPersonalInfoLoading] = useState(true); // Set to true for initial fetch
  const [personalInfoStatus, setPersonalInfoStatus] = useState("idle"); // "idle" | "success" | "error"
  const [personalInfoError, setPersonalInfoError] = useState(null); // For API error messages

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [passwordErrors, setPasswordErrors] = useState({}); // Client-side validation errors
  const [passwordApiError, setPasswordApiError] = useState(null); // For API error messages

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      setPersonalInfoLoading(true);
      setPersonalInfoError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Use the dashboard summary endpoint as it contains basic user info
        const response = await axios.get(
          "http://localhost:3000/api/dashboard/summary",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const userData = response.data.user;

        setPersonalInfo({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phoneNumber || "", // Ensure this matches your backend field
        });
      } catch (err) {
        console.error("Failed to fetch personal info:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
        setPersonalInfoError(
          err.response?.data?.message ||
            "Erreur lors du chargement des informations personnelles."
        );
      } finally {
        setPersonalInfoLoading(false);
      }
    };

    fetchPersonalInfo();
  }, [navigate]);

  // Personal Info Handlers
  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
    setPersonalInfoStatus("idle"); // Reset status on change
    setPersonalInfoError(null); // Clear error on change
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setPersonalInfoLoading(true);
    setPersonalInfoStatus("idle");
    setPersonalInfoError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:3000/api/auth/update-profile",
        {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone, // Ensure this matches backend expected field
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPersonalInfoStatus("success");
      setPersonalInfoError(null);
      console.log("Personal info updated:", response.data);

      // Update local storage user data
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...currentUser,
            fullName: response.data.user.fullName,
            email: response.data.user.email,
            phoneNumber: response.data.user.phoneNumber, // Make sure this is consistent
          })
        );
      }

      setTimeout(() => {
        setPersonalInfoStatus("idle"); // Clear success message after a few seconds
      }, 3000);
    } catch (err) {
      console.error("Error updating personal info:", err);
      setPersonalInfoStatus("error");
      setPersonalInfoError(
        err.response?.data?.message ||
          "Échec de la mise à jour des informations personnelles."
      );
    } finally {
      setPersonalInfoLoading(false);
    }
  };

  // Password Handlers
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear errors and status when user types
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    setPasswordStatus("idle");
    setPasswordApiError(null);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Le mot de passe actuel est requis";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "Le nouveau mot de passe est requis";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword =
        "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      errors.newPassword =
        "Le nouveau mot de passe doit être différent de l'ancien";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      setPasswordStatus("error"); // Indicate client-side validation failure
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus("idle");
    setPasswordApiError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPasswordStatus("success");
      setPasswordApiError(null);
      console.log("Password changed successfully:", response.data);
      // Clear password fields on success
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setPasswordStatus("idle"); // Clear success message
      }, 3000);
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordStatus("error");
      setPasswordApiError(
        err.response?.data?.message ||
          "Erreur lors du changement de mot de passe. Veuillez vérifier vos informations."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (personalInfoLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Paramètres du Compte
        </h1>
        <p className="text-gray-600 mt-2">
          Mettez à jour vos informations personnelles et votre mot de passe.
        </p>
      </div>

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informations Personnelles
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations de profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          {personalInfoStatus === "success" && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Informations mises à jour avec succès !</strong>
              </AlertDescription>
            </Alert>
          )}
          {personalInfoStatus === "error" && personalInfoError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{personalInfoError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName">Nom Complet</Label>
              <Input
                id="fullName"
                value={personalInfo.fullName}
                onChange={(e) =>
                  handlePersonalInfoChange("fullName", e.target.value)
                }
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <Label htmlFor="email">Adresse Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) =>
                    handlePersonalInfoChange("email", e.target.value)
                  }
                  className="pl-10"
                  placeholder="votre@email.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                La modification de l'email nécessitera une vérification
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Numéro de Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    handlePersonalInfoChange("phone", e.target.value)
                  }
                  className="pl-10"
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>

            <Button
              type="submit"
              className={cn(
                BUTTON_SIZE_DEFAULT,
                BUTTON_VARIANT_DEFAULT,
                "bg-blue-600 hover:bg-blue-700"
              )}
              disabled={personalInfoLoading}
            >
              {personalInfoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Changer le Mot de Passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordStatus === "success" && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Mot de passe modifié avec succès !</strong>
              </AlertDescription>
            </Alert>
          )}

          {passwordStatus === "error" &&
            (passwordApiError || Object.keys(passwordErrors).length > 0) && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Erreur lors du changement de mot de passe.
                </AlertTitle>
                <AlertDescription>
                  {passwordApiError ||
                    "Veuillez vérifier les champs ci-dessous."}
                  {Object.values(passwordErrors).map((err, index) => (
                    <p key={index} className="mt-1 text-sm">
                      {err}
                    </p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    handlePasswordChange("currentPassword", e.target.value)
                  }
                  className={
                    passwordErrors.currentPassword ? "border-red-500" : ""
                  }
                  placeholder="Votre mot de passe actuel"
                />
                <Button
                  type="button"
                  className={cn(BUTTON_SIZE_SM,BUTTON_VARIANT_GHOST,"absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent")}
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    className={passwordErrors.newPassword ? "border-red-500" : ""}
                    placeholder="Votre nouveau mot de passe"
                  />
                  <Button
                    type="button"
                    className={cn(BUTTON_SIZE_SM,BUTTON_VARIANT_GHOST,"absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent")}
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 8 caractères</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                  <Button
                    type="button"
                    className={cn(BUTTON_SIZE_SM,BUTTON_VARIANT_GHOST,"absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent")}
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className={cn(BUTTON_SIZE_DEFAULT,BUTTON_VARIANT_DEFAULT,"bg-blue-600 hover:bg-blue-700" )}disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changement en cours...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
          </form>
        </CardContent>
      </Card>

      
        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Sécurité:</strong> Nous vous recommandons d'utiliser un mot de passe fort et unique. Votre mot de
            passe est chiffré et sécurisé selon les standards de l'industrie.
          </AlertDescription>
        </Alert>

        {/* Account Actions */}
        <Card>
        <CardHeader>
            <CardTitle>Actions du Compte</CardTitle>
            <CardDescription>Autres actions disponibles pour votre compte</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Exporter mes données</h4>
                  <p className="text-sm text-gray-600">Téléchargez une copie de toutes vos données</p>
                </div>
                <Button className={cn(BUTTON_VARIANT_OUTLINE,BUTTON_SIZE_DEFAULT)} onClick={() => alert("Fonctionnalité d'exportation de données à implémenter.")}> {/* TODO: make the download data function */}
                  Exporter
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Supprimer mon compte</h4>
                  <p className="text-sm text-gray-600">
                    Suppression définitive de votre compte et de toutes vos données
                  </p>
                </div>
                <Button
                  className={cn(BUTTON_VARIANT_OUTLINE,BUTTON_SIZE_DEFAULT,"text-red-600 hover:text-red-700 hover:bg-red-50")}
                  onClick={() => alert("Fonctionnalité de suppression de compte à implémenter avec un modal de confirmation.")}
                >
                  Supprimer
                </Button>
              </div>
          </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default SettingsPage;
