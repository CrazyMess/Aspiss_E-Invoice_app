import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import your UI components
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert";
import { Progress } from "../components/ui/progress";

// Import Lucide React icons
import {
  Building2,
  FileText,
  Download,
  CreditCard,
  AlertTriangle,
  Plus,
  Edit,
  CheckCircle,
  BarChart3,
  Loader2,
  Info,
  AlertCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  ALERT_VARIANT_DEFAULT,
  ALERT_VARIANT_DESTRUCTIVE,
  BADGE_VARIANT_DEFAULT,
  BADGE_VARIANT_DESTRUCTIVE,
  BADGE_VARIANT_OUTLINE,
  BUTTON_SIZE_DEFAULT,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();

  // State to hold dashboard data, loading state, and error state
  const [DashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login"); // Redirect to login if no token is found
          return;
        }

        const response = await axios.get(
          "http://localhost:3000/api/dashboard/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the request headers
            },
          }
        );
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (err.response && err.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token"); // Clear token
          localStorage.removeItem("user"); // Clear user data
          navigate("/login"); // Redirect to login
          setError("Session expirée. Veuillez vous reconnecter.");
        } else {
          setError(
            err.response?.data?.message ||
              "Erreur lors fu chargement du tabloeau de bord. Veuillez réessayer plus tard."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={cn(ALERT_VARIANT_DESTRUCTIVE)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Destructure the dashboard data
  const { user, subscription, companies, recentActivity, hasBillingInfo } =
    DashboardData;
  const progressPercentage =
    (subscription.invoicesGenerated / subscription.invoicesLimit) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">
          Bienvenue, {user?.fullName || "Utilisateur"} dans votre espace de
          gestion des factures électroniques
        </p>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Mon Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Conditional message based on billing info and plan */}
          {!hasBillingInfo && subscription.plan === "free" ? (
            <Alert
              className={cn(
                ALERT_VARIANT_DEFAULT,
                "mb-4 border border-blue-200 bg-blue-50"
              )}
            >
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Vous utilisez actuellement le plan GRATUIT. Pour accéder à des
                fonctionnalités complètes et des limites plus élevées, veuillez{" "}
                <Link
                  to="/billing-info"
                  className="font-medium text-blue-700 hover:underline"
                >
                  configurer vos informations de facturation
                </Link>{" "}
                et choisir un plan.
              </AlertDescription>
            </Alert>
          ) : // Exisiting subscription status display
          subscription.status === "inactive"  ? (
            <Alert className={cn(ALERT_VARIANT_DESTRUCTIVE, "mb-4")}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Votre abonnement est inactif.</strong> Vous ne pouvez
                pas générer de fichiers XML. Veuillez renouveler votre
                abonnement pour continuer.
              </AlertDescription>
            </Alert>
          ) : subscription.plan === "free" ? (
            <Alert className="mb-4 border border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre abonnement est actif et fonctionne parfaitement.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 border border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Vous utilisez actuellement la version gratuite. Cliquez sur « Gérer mon abonnement » ci-dessous pour débloquer plus de fonctionnalités.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <Badge
                className={cn(
                  subscription.status === "active"
                    ? BADGE_VARIANT_DEFAULT
                    : BADGE_VARIANT_DESTRUCTIVE
                )}
              >
                {subscription.status === "active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Plan</p>
              <p className="text-lg font-semibold">{subscription.plan}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expire le</p>
              <p className="text-lg font-semibold">
                {new Date(subscription.expirationDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-500">
                Factures générées ce mois
              </p>
              <p className="text-sm text-gray-600">
                {subscription.invoicesGenerated} / {subscription.invoicesLimit}
              </p>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="mt-6">
            <Button
              className={cn(
                subscription.status === "inactive"
                  ? BUTTON_VARIANT_DEFAULT
                  : BUTTON_VARIANT_OUTLINE,
                BUTTON_SIZE_DEFAULT,
              )}
            >
              {subscription.status === "inactive"
                ? "Renouveler maintenant"
                : "Gérer mon abonnement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Générer des factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Créez vos fichiers XML conformes TTN
            </p>
            <Link to="/generate">
              <Button
                className={cn(
                  BUTTON_VARIANT_DEFAULT,
                  BUTTON_SIZE_DEFAULT,
                  "w-full bg-blue-600 hover:bg-blue-700"
                )}
              >
                Commencer
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2 text-green-600" />
              Mes entreprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Gérez vos informations d'entreprise
            </p>
            <Link to="/companies">
              <Button
                className={cn(
                  BUTTON_VARIANT_OUTLINE,
                  BUTTON_SIZE_DEFAULT,
                  "w-full"
                )}
              >
                Gérer ({companies.length})
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Download className="h-5 w-5 mr-2 text-purple-600" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Consultez vos téléchargements</p>
            <Link to="/history">
              <Button
                className={cn(
                  BUTTON_VARIANT_OUTLINE,
                  BUTTON_SIZE_DEFAULT,
                  "w-full"
                )}
              >
                Voir l'historique
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Companies Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Mes entreprises
            </CardTitle>
            <Link to="/companies/add">
              <Button
                className={cn(
                  BUTTON_SIZE_SM,
                  BUTTON_VARIANT_DEFAULT,
                  "bg-blue-600 hover:bg-blue-700 "
                )}
              >
                <Plus className="h-4 w-4" />
                Ajouter une entreprise
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez pas encore configuré d'entreprises.
                <Link
                  to="/companies/add"
                  className="font-medium text-blue-600 hover:underline ml-1"
                >
                  Ajoutez une nouvelle entreprise
                </Link>
                pour commencer.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Numéro fiscal: {company.taxId} • {company.city} {company.country && `• ${company.country}`}
                    </p>
                    {company.email && <p className="text-xs text-gray-500">Email: {company.email}</p>}
                    {company.phone && <p className="text-xs text-gray-500">Téléphone: {company.phone}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={cn(
                        BADGE_VARIANT_OUTLINE,
                        "text-green-600 border-green-600"
                      )}
                    >
                      {company.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                   <Link to={`/companies/edit/${company.id}`}>
                   <Button
                      className={cn(BUTTON_SIZE_SM, BUTTON_VARIANT_OUTLINE)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                   </Link> 
                    
                    <Link to={`/generate?company=${company.id}`}>
                      <Button
                        className={cn(
                          BUTTON_SIZE_SM,
                          BUTTON_VARIANT_DEFAULT,
                          "bg-blue-600 hover:bg-blue-700"
                        )}
                      >
                        Sélectionner
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          { recentActivity.length === 0 ? (
            <Alert className={cn(ALERT_VARIANT_DEFAULT, "mb-4")}>
              <Info className="h-4 w-4" />
              <AlertDescription>Aucune activité récente à afficher.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.company} • {activity.count} factures
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={cn(BADGE_VARIANT_OUTLINE,activity.status === "success" ? "text-green-600 border-green-600" : "text-red-600 border-red-600")}
                  >
                     {activity.status === "success" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {activity.status === "success" ? "Réussi" : "Échec"}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
