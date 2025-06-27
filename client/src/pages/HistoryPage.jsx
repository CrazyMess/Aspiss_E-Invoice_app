import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Use react-router-dom
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
import { Badge } from "../components/ui/Badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert"; // Import AlertTitle
import { Input } from "../components/ui/Input";

// Import Lucide React icons
import {
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Search,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  Archive,
  Loader2, // For loading spinner
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BADGE_VARIANT_OUTLINE,
  BUTTON_SIZE_SM,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

const HistoryPage = () => {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]); // State to hold fetched activities
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "success" | "error"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch activities
  const fetchActivities = useCallback (async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      const response = await axios.get("http://localhost:3000/api/activity", {
        headers: {
          Authorization: `Bearer ${token}`, // Use Bearer token
        },
      });
      // Map backend activity structure to frontend expected structure
      // activity_id -> id
      // created_at -> date (and time)
      // action, company, count, status are direct matches
      // fileSize, fileName are not directly from backend yet, will mock
      const formattedActivities = response.data.map((activity) => {
        const createdAtDate = new Date(activity.created_at);
        return {
          id: activity.activity_id,
          activityName: activity.action,
          company: activity.company || "N/A", // Company might be null for some activities
          invoiceCount: activity.count || 0,
          date: createdAtDate.toLocaleDateString("fr-FR"), // Format date
          time: createdAtDate.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }), // Format time
          status: activity.status,
          fileSize: "N/A", // Placeholder, not in backend yet
          fileName: "N/A", // Placeholder, not in backend yet
          details: activity.details, // Keep original details if needed
        };
      });
      setActivities(formattedActivities);
    } catch (err) {
      console.error("Failed to fetch activity data:", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        setError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setError(
          err.response?.data?.message ||
            "Erreur lors du chargement de l'historique des activités."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDownload = (activity) => {
    if (activity.status === "success" && activity.fileName !== "N/A") {
      // In a real app, this would trigger actual file download
      // For now, simulate by logging and potentially creating a dummy link
      // TODO: Implement actual file download logic
      console.log(`Simulating download for: ${activity.fileName}`);
      alert(`Téléchargement de ${activity.fileName} simulé.`); // Use alert for simplicity in demo
      // You would typically hit a backend endpoint that serves the file, e.g.:
      // window.open(`http://localhost:3000/api/files/download/${activity.id}`, '_blank');
    } else {
      alert("Aucun fichier disponible pour le téléchargement.");
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || activity.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const successCount = activities.filter((a) => a.status === "success").length;
  const errorCount = activities.filter((a) => a.status === "error").length;
  const totalInvoices = activities.reduce(
    (sum, a) => sum + (a.status === "success" ? a.invoiceCount : 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Historique des Générations & Téléchargements
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez et téléchargez vos fichiers XML générés.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Générations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Réussies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {successCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Échecs</p>
                <p className="text-2xl font-bold text-gray-900">{errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Factures Totales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par entreprise ou activité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className={cn(
                  filterStatus === "all"
                    ? BUTTON_VARIANT_DEFAULT
                    : BUTTON_VARIANT_OUTLINE,
                  BUTTON_SIZE_SM,
                  ""
                )}
                onClick={() => setFilterStatus("all")}
              >
                Tous
              </Button>
              <Button
                onClick={() => setFilterStatus("success")}
                className={cn(
                  filterStatus === "success"
                    ? BUTTON_VARIANT_DEFAULT
                    : BUTTON_VARIANT_OUTLINE,
                  BUTTON_SIZE_SM,
                  filterStatus === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                )}
              >
                Réussis
              </Button>
              <Button
                variant={filterStatus === "error" ? "default" : "outline"}
                onClick={() => setFilterStatus("error")}
                size="sm"
                className={cn(
                  filterStatus === "error"
                    ? BUTTON_VARIANT_DEFAULT
                    : BUTTON_VARIANT_OUTLINE,
                  BUTTON_SIZE_SM,
                  filterStatus === "error" ? "bg-red-600 hover:bg-red-700" : ""
                )}
              >
                Échecs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des Activités</span>
            <Button
              className={cn(BUTTON_VARIANT_OUTLINE, BUTTON_SIZE_SM)}
              onClick={fetchActivities}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </CardTitle>
          <CardDescription>
            {loading
              ? "Chargement..."
              : `${filteredActivities.length} résultat${
                  filteredActivities.length !== 1 ? "s" : ""
                } trouvé${filteredActivities.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="ml-2 text-gray-700">
                Chargement de l'historique...
              </p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !filteredActivities.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || filterStatus !== "all"
                  ? "Aucune activité ne correspond à vos critères de recherche."
                  : "Aucune activité récente à afficher."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.status === "success"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {activity.status === "success" ? (
                        <FileText className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {activity.activityName}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            BADGE_VARIANT_OUTLINE,
                            activity.status === "success"
                              ? "text-green-600 border-green-600"
                              : "text-red-600 border-red-600"
                          )}
                        >
                          {activity.status === "success" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Réussi
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Échec
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-2 sm:mt-0">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {activity.company}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {activity.invoiceCount} facture
                          {activity.invoiceCount !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {activity.date} à {activity.time}
                        </div>
                        {activity.status === "success" &&
                          activity.fileSize !== "N/A" && (
                            <div>
                              <span className="text-gray-500">
                                Taille: {activity.fileSize}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    {activity.status === "success" ? (
                      <Button
                        onClick={() => handleDownload(activity)}
                        className={cn(
                          BUTTON_SIZE_SM,
                          BUTTON_VARIANT_DEFAULT,
                          "bg-blue-600 hover:bg-blue-700"
                        )}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le Fichier
                      </Button>
                    ) : (
                      <Button
                        className={cn(BUTTON_SIZE_SM, BUTTON_VARIANT_OUTLINE)}
                        disabled
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Échec
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Alert>
        <Download className="h-4 w-4" />
        <AlertDescription>
          <strong>Conseil:</strong> Les fichiers sont conservés pendant 90
          jours. Téléchargez vos fichiers importants pour les conserver plus
          longtemps.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default HistoryPage;
