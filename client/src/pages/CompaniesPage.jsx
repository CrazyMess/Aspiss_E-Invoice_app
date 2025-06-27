import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Use react-router-dom
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

// Import Lucide React icons
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BADGE_VARIANT_OUTLINE,
  BUTTON_SIZE_DEFAULT,
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_OUTLINE,
} from "../lib/tailwindClassStrings";

const CompaniesPage = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({
    id: null,
    status: "idle",
    message: "",
  });

  // Function to fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:3000/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Map backend company structure (snake_case) to frontend (camelCase)
      const formattedCompanies = response.data.map((company) => ({
        id: company.company_id,
        name: company.name,
        taxId: company.tax_id,
        taxIdTypeCode: company.tax_id_type_code,
        address: company.address,
        city: company.city,
        postalCode: company.postal_code,
        country: company.country,
        email: company.email,
        phone: company.phone,
        status: company.status, // Assuming a status column exists
      }));
      setCompanies(formattedCompanies);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        setError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setError(
          err.response?.data?.message ||
            "Erreur lors du chargement des entreprises."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (id, companyName) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'entreprise "${companyName}" ? Cette action est irréversible.`
      )
    ) {
      setDeleteStatus({ id, status: "loading", message: "" });
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        await axios.delete(`http://localhost:3000/api/companies/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDeleteStatus({
          id: null,
          status: "success",
          message: `L'entreprise "${companyName}" a été supprimée avec succès.`,
        });
        setCompanies(companies.filter((company) => company.id !== id)); // Optimistically update UI
      } catch (err) {
        console.error(`Error deleting company ${id}:`, err);
        setDeleteStatus({
          id,
          status: "error",
          message:
            err.response?.data?.message ||
            `Erreur lors de la suppression de l'entreprise "${companyName}".`,
        });
      } finally {
        // Clear status message after a few seconds
        setTimeout(
          () => setDeleteStatus({ id: null, status: "idle", message: "" }),
          5000
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Chargement des entreprises...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Entreprises</h1>
          <p className="text-gray-600 mt-2">
            Gérez les informations de vos entreprises pour la génération de
            factures XML
          </p>
        </div>
        <Link to="/companies/add">
          <Button
            className={cn(
              BUTTON_SIZE_DEFAULT,
              BUTTON_VARIANT_DEFAULT,
              "bg-blue-600 hover:bg-blue-700"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une entreprise
          </Button>
        </Link>
      </div>

      {/* Delete Status Alert */}
      {deleteStatus.status === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {deleteStatus.message}
          </AlertDescription>
        </Alert>
      )}
      {deleteStatus.status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de suppression</AlertTitle>
          <AlertDescription>{deleteStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* Companies List */}
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune entreprise configurée
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore ajouté d'entreprise. Commencez par ajouter
              votre première entreprise.
            </p>
            <Link to="/companies/add">
              <Button
                className={cn(
                  BUTTON_SIZE_DEFAULT,
                  BUTTON_VARIANT_DEFAULT,
                  "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une nouvelle entreprise
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      {company.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Numéro fiscal: {company.taxId}
                    </CardDescription>
                  </div>
                  {/* Assuming status is dynamic based on data, otherwise keep hardcoded for now */}
                  <Badge
                    className={cn(
                      BADGE_VARIANT_OUTLINE,
                      "text-green-600 border-green-600"
                    )}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actif{" "}
                    {/* Based on UX, status is "Actif" or "Inactif" from backend */}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Adresse</p>
                    <p className="text-gray-900">{company.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ville</p>
                    <p className="text-gray-900">
                      {company.city}, {company.postalCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pays</p>
                    <p className="text-gray-900">{company.country}</p>
                  </div>
                  {/* Display email and phone if they exist */}
                  {company.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{company.email}</p>
                    </div>
                  )}
                  {company.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Téléphone
                      </p>
                      <p className="text-gray-900">{company.phone}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">

                  <Link to={`/generate?company=${company.id}`}>
                    <Button
                      className={cn(
                        BUTTON_SIZE_DEFAULT,
                        BUTTON_VARIANT_DEFAULT,
                        "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      Sélectionner pour génération
                    </Button>
                  </Link>

                  <Link to={`/companies/edit/${company.id}`}>
                    <Button
                      className={cn(
                        BUTTON_SIZE_DEFAULT,
                        BUTTON_VARIANT_OUTLINE
                      )}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier infos
                    </Button>
                  </Link>

                  <Button
                    className={cn(
                      BUTTON_SIZE_DEFAULT,
                      BUTTON_VARIANT_OUTLINE,
                      "text-red-600 hover:text-red-700 hover:bg-red-50"
                    )}
                    onClick={() => handleDelete(company.id, company.name)}
                    disabled={
                      deleteStatus.id === company.id &&
                      deleteStatus.status === "loading"
                    }
                  >
                    {deleteStatus.id === company.id &&
                    deleteStatus.status === "loading" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {deleteStatus.id === company.id &&
                    deleteStatus.status === "loading"
                      ? "Suppression..."
                      : "Supprimer"}
                  </Button>
                  
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Section */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Conseil:</strong> Assurez-vous que toutes les informations de
          vos entreprises sont correctes et à jour pour garantir la conformité
          de vos factures XML avec les standards TTN.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CompaniesPage;
