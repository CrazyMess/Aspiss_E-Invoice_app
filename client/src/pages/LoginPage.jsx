// client/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cn } from "../lib/utils"; // Import cn utility

import { Eye, EyeOff, AlertCircle } from 'lucide-react';

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
  LABEL_BASE
} from "../lib/tailwindClassStrings";


export default function LoginPage({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    if (!formData.email || !formData.password) {
      setApiError("Veuillez entrer votre email et votre mot de passe.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      console.log('Login successful:', response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Store full user object

      if (onLoginSuccess) {
        onLoginSuccess(response.data.user); // Pass user data to parent component
      }
      
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('Une erreur inattendue est survenue lors de la connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            XML Invoice Generator
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Connexion à votre compte</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              créez un nouveau compte
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
            <CardDescription>Entrez vos identifiants pour accéder à votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            {apiError && (
              <Alert className={cn(ALERT_VARIANT_DESTRUCTIVE, "mb-6")}>
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className={LABEL_BASE}>Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={LABEL_BASE}>Mot de passe</Label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                  />
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
              </div>

              <Button
                type="submit"
                className={cn(BUTTON_VARIANT_DEFAULT, BUTTON_SIZE_DEFAULT, "w-full bg-blue-600 hover:bg-blue-700")}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Alert className={cn(ALERT_VARIANT_DEFAULT)}>
                <AlertDescription className="text-sm">
                  <strong>Info:</strong> Utilisez un compte que vous avez enregistré pour vous connecter.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}