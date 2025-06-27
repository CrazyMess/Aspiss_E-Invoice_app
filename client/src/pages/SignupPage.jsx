// client/src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cn } from "../lib/utils"; // Import cn utility

import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// Import your UI components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Alert, AlertDescription } from '../components/ui/Alert';

// Import class constants
import {
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_GHOST,
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  ALERT_VARIANT_DEFAULT,
  ALERT_VARIANT_DESTRUCTIVE,
  ALERT_VARIANT_SUCCESS,
  LABEL_BASE
} from "../lib/tailwindClassStrings";

export default function SignupPage({ onSignupSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    const newErrors = { ...errors };

    if (field === "email" && typeof value === "string") {
      if (value && !validateEmail(value)) {
        newErrors.email = "Format d'email invalide";
      } else {
        delete newErrors.email;
      }
    }

    if (field === "password" && typeof value === "string") {
      if (value && !validatePassword(value)) {
        newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
      } else {
        delete newErrors.password;
      }
      if (formData.confirmPassword && formData.confirmPassword !== value) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      } else if (formData.confirmPassword && formData.confirmPassword === value) {
        delete newErrors.confirmPassword;
      }
    }

    if (field === "confirmPassword" && typeof value === "string") {
      if (value && value !== formData.password) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    const finalErrors = {};
    if (!formData.fullName) finalErrors.fullName = "Le nom complet est requis.";
    if (!formData.email) {
      finalErrors.email = "L'adresse email est requise.";
    } else if (!validateEmail(formData.email)) {
      finalErrors.email = "Format d'email invalide.";
    }
    if (!formData.password) {
      finalErrors.password = "Le mot de passe est requis.";
    } else if (!validatePassword(formData.password)) {
      finalErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (formData.password !== formData.confirmPassword) {
      finalErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (!formData.phoneNumber) finalErrors.phoneNumber = "Le numéro de téléphone est requis.";

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/auth/signup', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
      });

      setApiSuccess(response.data.message || 'Inscription réussie ! Redirection vers le tableau de bord ...');
      console.log('Signup successful:', response.data);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Store full user object

      if (onSignupSuccess) {
        onSignupSuccess(response.data.user); // Pass user data to parent
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Signup API error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('Une erreur inattendue est survenue lors de l\'inscription.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.phoneNumber &&
    Object.keys(errors).length === 0 &&
    formData.password === formData.confirmPassword &&
    validateEmail(formData.email) &&
    validatePassword(formData.password);


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            XML Invoice Generator
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Créer votre compte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>Remplissez les informations ci-dessous pour créer votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Error/Success Messages */}
              {apiError && (
                <Alert className={cn(ALERT_VARIANT_DESTRUCTIVE, "mb-6")}>
                  <XCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              {apiSuccess && (
                <Alert className={cn(ALERT_VARIANT_SUCCESS, "mb-6")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{apiSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Full Name Field */}
              <div>
                {/* Label uses its base classes */}
                <Label htmlFor="fullName" className={LABEL_BASE}>Nom Complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={errors.fullName ? "border-red-500" : ""}
                  placeholder="Votre nom complet"
                  required
                />
                {errors.fullName && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.fullName}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                {/* Label uses its base classes */}
                <Label htmlFor="email" className={LABEL_BASE}>Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="votre@email.com"
                  required
                />
                {errors.email && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
                {formData.email && !errors.email && validateEmail(formData.email) && (
                  <div className="flex items-center mt-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Email valide
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                {/* Label uses its base classes */}
                <Label htmlFor="password" className={LABEL_BASE}>Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-red-500" : ""}
                    placeholder="Minimum 8 caractères"
                    required
                  />
                  {/* Apply all classes directly */}
                  <Button
                    type="button"
                    className={cn(BUTTON_VARIANT_GHOST, BUTTON_SIZE_SM, "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent")}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                {/* Label uses its base classes */}
                <Label htmlFor="confirmPassword" className={LABEL_BASE}>Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    placeholder="Répétez votre mot de passe"
                    required
                  />
                  {/* Apply all classes directly */}
                  <Button
                    type="button"
                    className={cn(BUTTON_VARIANT_GHOST, BUTTON_SIZE_SM, "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent")}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
                {formData.confirmPassword &&
                  !errors.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <div className="flex items-center mt-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mots de passe identiques
                    </div>
                  )}
              </div>

              {/* Phone Number Field */}
              <div>
                {/* Label uses its base classes */}
                <Label htmlFor="phoneNumber" className={LABEL_BASE}>Numéro de Téléphone</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                  placeholder="+216 12 345 678"
                  required
                />
                {errors.phoneNumber && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.phoneNumber}
                  </div>
                )}
              </div>

              {/* Apply all classes directly */}
              <Button
                type="submit"
                className={cn(BUTTON_VARIANT_DEFAULT, BUTTON_SIZE_DEFAULT, "w-full bg-blue-600 hover:bg-blue-700")}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </form>

            <div className="mt-6">
              {/* Apply all classes directly */}
              <Alert className={cn(ALERT_VARIANT_DEFAULT)}>
                <AlertDescription className="text-sm">
                  En créant un compte, vous acceptez nos{' '}
                  <Link to="#" className="text-blue-600 hover:underline">
                    conditions d'utilisation
                  </Link>{' '}
                  et notre{' '}
                  <Link to="#" className="text-blue-600 hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}