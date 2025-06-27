import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import UI components
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";
import DashboardLayout from "../components/dashboard-layout"; // Adjusted import path
import {
  AlertTriangle,
  Building2,
  Check,
  CreditCard,
  FileText,
  HeadphonesIcon,
  Info,
  Loader2,
  Star,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  ALERT_VARIANT_DESTRUCTIVE,
  BADGE_VARIANT_DEFAULT,
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";
import axios from "axios";

const SubscriptionPage = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null); // To store all fetched data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          "http://localhost:3000/api/dashboard/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDashboardData(response.data); // Set the entire dashboard summary data
      } catch (err) {
        console.error(
          "Failed to fetch dashboard summary for subscription page:",
          err
        );
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token"); // Clear token if unauthorized
          localStorage.removeItem("user");
          navigate("/login");
          setError("Session expirée. Veuillez vous reconnecter.");
        } else {
          setError(
            err.response?.data?.message ||
              "Erreur lors du chargement des informations d'abonnement."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-2 text-gray-700">Chargement des abonnements...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert className={cn(ALERT_VARIANT_DESTRUCTIVE)}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Destructure relevant data after loading
  const currentSubscription = dashboardData.subscription;
  const hasBillingInfo = dashboardData.hasBillingInfo;

  const plans = [
    {
      id: "free",
      name: "Plan Gratuit",
      price: "0DT/mois",
      description: "Parfait pour débuter",
      features: [
        `Jusqu'à ${currentSubscription.invoicesLimit} factures/mois`, // Dynamic limit
        "1 entreprise maximum",
        "Génération XML basique",
        "Support par email",
        "Stockage 30 jours",
      ],
      limitations: ["Fonctionnalités limitées", "Support standard uniquement"],
      buttonText: "Plan Actuel",
      buttonVariant: BUTTON_VARIANT_OUTLINE, // Use direct variant string
      isCurrentPlan: currentSubscription.plan === "Free", // Match backend plan name
      popular: false,
    },
    {
      id: "pro",
      name: "Plan Pro",
      price: "29DT/mois",
      description: "Pour les professionnels",
      features: [
        "Jusqu'à 500 factures/mois",
        "Entreprises illimitées",
        "Génération XML avancée",
        "Support prioritaire",
        "Stockage 1 an",
        "Modèles personnalisés",
        "Export en lot",
        "Validation avancée",
      ],
      limitations: [],
      buttonText: "Mettre à niveau",
      buttonVariant: BUTTON_VARIANT_DEFAULT, // Use direct variant string
      isCurrentPlan: currentSubscription.plan === "Pro", // Match backend plan name
      popular: true,
    },
    {
      id: "enterprise",
      name: "Plan Entreprise",
      price: "Sur devis",
      description: "Pour les grandes organisations",
      features: [
        "Factures illimitées",
        "Entreprises illimitées",
        "API dédiée",
        "Support 24/7",
        "Stockage illimité",
        "Intégration ERP",
        "Formation personnalisée",
        "Gestionnaire de compte dédié",
        "SLA garanti",
      ],
      limitations: [],
      buttonText: "Nous contacter",
      buttonVariant: BUTTON_VARIANT_OUTLINE, // Use direct variant string
      isCurrentPlan: currentSubscription.plan === "Enterprise", // Match backend plan name
      popular: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Mes Abonnements</h1>
        <p className="text-gray-600 mt-2">
          Choisissez le plan qui vous convient le mieux et gérez votre
          abonnement actuel.
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Abonnement Actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Plan Actuel</p>
              <p className="text-lg font-semibold">
                {currentSubscription.plan}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge
                className={cn(
                  BADGE_VARIANT_DEFAULT,
                  "bg-green-100 text-green-800"
                )}
              >
                {currentSubscription.status === "active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expire le</p>
              <p className="text-lg font-semibold">
                {new Date(
                  currentSubscription.expirationDate
                ).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert for Free Users without Billing Info */}
      {currentSubscription.plan === "Free" && !hasBillingInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Débloquez les fonctionnalités complètes !</strong>
            <br />
            Vous utilisez actuellement le plan Gratuit. Pour accéder à des
            fonctionnalités complètes et des limites plus élevées, veuillez{" "}
            <Link
              to="/billing-info"
              className="font-medium underline hover:no-underline"
            >
              configurer vos informations de facturation
            </Link>
            .
            <div className="mt-3">
              <Link to="/billing-info">
                <Button
                  className={cn(
                    BUTTON_SIZE_SM,
                    BUTTON_VARIANT_DEFAULT,
                    "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  Configurer mes infos de facturation
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative hover:shadow-lg transition-shadow ${
              plan.popular ? "ring-2 ring-blue-500 shadow-lg" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600 my-2">
                {plan.price}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Fonctionnalités incluses:
                </h4>
                <ul className="space-y-2 max-w-sm mx-auto lg:mx-0 lg:max-w-none">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Limitations:
                  </h4>
                  <ul className="space-y-2 max-w-sm mx-auto lg:mx-0 lg:max-w-none">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-sm text-gray-500">
                          • {limitation}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Button */}
              <Button
                className={cn(
                  plan.buttonVariant, BUTTON_SIZE_DEFAULT,
                  `w-full ${
                    plan.isCurrentPlan
                      ? "cursor-not-allowed opacity-75"
                      : plan.buttonVariant === BUTTON_VARIANT_DEFAULT
                      ? "bg-blue-600 hover:bg-blue-700"
                      : ""
                  }`
                )}
                disabled={plan.isCurrentPlan}
              >
                {plan.isCurrentPlan ? "Plan Actuel" : plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Gestion Multi-Entreprise</h3>
            <p className="text-sm text-gray-600">Gérez plusieurs entreprises depuis un seul compte</p>
          </Card>

          <Card className="text-center p-6">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Conformité TTN</h3>
            <p className="text-sm text-gray-600">Fichiers XML 100% conformes aux standards tunisiens</p>
          </Card>

          <Card className="text-center p-6">
            <HeadphonesIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Support Expert</h3>
            <p className="text-sm text-gray-600">Équipe d'experts disponible pour vous accompagner</p>
          </Card>
        </div>

        {/* FAQ or Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Besoin d'aide pour choisir ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Notre équipe est là pour vous aider à choisir le plan qui correspond le mieux à vos besoins.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_DEFAULT)}>
                <HeadphonesIcon className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
              <Button className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_DEFAULT)}>
                <Users className="h-4 w-4 mr-2" />
                Demander une démo
              </Button>
            </div>
          </CardContent>
        </Card>

    </div>
  );
};

export default SubscriptionPage;
