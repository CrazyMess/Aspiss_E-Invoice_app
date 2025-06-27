// client/src/pages/HomePage.jsx

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils"; // Import cn utility

// Import your UI components (now simpler wrappers)
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

// Import all necessary Lucide React icons
import {
  CheckCircle,
  Shield,
  Clock,
  Building2,
  HeadphonesIcon,
  UserPlus,
  Building,
  Copy,
  Download,
  ArrowRight,
  Star,
} from "lucide-react";

// Import all class constants
import {
  BUTTON_VARIANT_DEFAULT,
  BUTTON_VARIANT_GHOST,
  BUTTON_VARIANT_SECONDARY,
  BUTTON_SIZE_LG,
  BADGE_VARIANT_SECONDARY,
  BUTTON_SIZE_DEFAULT,
} from "../lib/tailwindClassStrings";

export default function HomePage() {
  const steps = [
    {
      icon: UserPlus,
      title: "Créez/Connectez-vous",
      description: "Inscription rapide et sécurisée",
    },
    {
      icon: Building,
      title: "Sélectionnez votre entreprise",
      description: "Ajoutez ou choisissez votre entreprise",
    },
    {
      icon: Copy,
      title: "Copiez-collez vos données Excel",
      description: "Import direct depuis Excel",
    },
    {
      icon: Download,
      title: "Téléchargez vos fichiers XML",
      description: "Fichiers conformes TTN prêts",
    },
  ];

  const sellingPoints = [
    {
      icon: CheckCircle,
      title: "Conformité Garantie",
      description: "100% conforme aux standards TTN et El Fatoura",
    },
    {
      icon: Shield,
      title: "Sécurité & Confidentialité",
      description: "Vos données sont protégées et chiffrées",
    },
    {
      icon: Clock,
      title: "Gain de Temps & Zéro Erreurs",
      description: "Automatisation complète du processus",
    },
    {
      icon: Building2,
      title: "Gestion Multi-Entreprise",
      description: "Gérez plusieurs entreprises facilement",
    },
    {
      icon: HeadphonesIcon,
      title: "Support Dédié",
      description: "Équipe d'experts à votre disposition",
    },
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      company: "Comptabilité Plus",
      text: "Un outil indispensable pour notre cabinet. Nos clients sont ravis de la simplicité.",
      rating: 5,
    },
    {
      name: "Ahmed Ben Ali",
      company: "Tech Solutions SARL",
      text: "Fini les erreurs de format XML. L'outil génère parfaitement nos factures conformes.",
      rating: 5,
    },
    {
      name: "Sophie Martin",
      company: "Freelance Consulting",
      text: "Interface intuitive et support client exceptionnel. Je recommande vivement.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">XML Invoice Generator</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                {/* Apply all classes directly */}
                <Button className={cn(BUTTON_VARIANT_GHOST, BUTTON_SIZE_DEFAULT, "text-gray-600 hover:text-gray-900")}>
                  Se connecter
                </Button>
              </Link>
              <Link to="/signup">
                {/* Apply all classes directly */}
                <Button className={cn(BUTTON_VARIANT_DEFAULT, BUTTON_SIZE_DEFAULT, "bg-blue-600 hover:bg-blue-700 text-white")}>S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Générez vos factures électroniques XML conformes TTN –{" "}
            <span className="text-blue-600">Simple et Sécurisé !</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Convertissez vos données Excel en fichiers XML officiels pour El Fatoura, avec une gestion d'entreprise
            simplifiée.
          </p>
          <Link to="/signup">
            {/* Apply all classes directly */}
            <Button className={cn(BUTTON_VARIANT_DEFAULT, BUTTON_SIZE_LG, "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg")}>
              Démarrer Gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-600">4 étapes simples pour générer vos factures XML</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  {/* Apply all classes directly */}
                  <Badge className={cn(BADGE_VARIANT_SECONDARY, "mb-3")}>
                    Étape {index + 1}
                  </Badge>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Selling Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi nous choisir ?</h2>
            <p className="text-lg text-gray-600">Les avantages qui font la différence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sellingPoints.map((point, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <point.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-gray-600">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-lg text-gray-600">Témoignages de satisfaction</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à simplifier votre facturation électronique ?</h2>
          <p className="text-xl text-blue-100 mb-8">Rejoignez des centaines d'entreprises qui nous font confiance</p>
          <Link to="/signup">
            {/* Apply all classes directly */}
            <Button className={cn(BUTTON_VARIANT_SECONDARY, BUTTON_SIZE_LG,"px-8 py-4 text-lg")}>
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">XML Invoice Generator</h3>
              <p className="text-gray-400">
                Solution complète pour la génération de factures électroniques XML conformes.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Centre d'aide
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="#" className="hover:text-white">
                    Conditions d'utilisation
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-white">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 XML Invoice Generator. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}