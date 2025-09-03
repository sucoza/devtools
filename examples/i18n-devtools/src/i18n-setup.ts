import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: 'I18n DevTools Plugin Demo',
      greeting: 'Hello {{name}}!',
      examples: {
        basic: 'Basic Translations',
        interpolation: 'Interpolation Example',
        pluralization: 'Pluralization'
      },
      common: {
        welcome: 'Welcome',
        button: {
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          search: 'Search'
        },
        message: {
          loading: 'Loading...',
          error: 'An error occurred',
          success: 'Operation successful'
        },
        navigation: {
          home: 'Home',
          profile: 'Profile',
          settings: 'Settings',
          logout: 'Log Out'
        }
      },
      search: {
        results: 'Search Results',
        noResults: 'No results found',
        placeholder: 'Enter search term...'
      }
    }
  },
  es: {
    translation: {
      title: 'Demo del Plugin I18n DevTools',
      greeting: '¡Hola {{name}}!',
      examples: {
        basic: 'Traducciones Básicas',
        interpolation: 'Ejemplo de Interpolación',
        pluralization: 'Pluralización'
      },
      common: {
        welcome: 'Bienvenido',
        button: {
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          search: 'Buscar'
        },
        message: {
          loading: 'Cargando...',
          error: 'Ocurrió un error',
          success: 'Operación exitosa'
        },
        navigation: {
          home: 'Inicio',
          profile: 'Perfil',
          settings: 'Configuración',
          logout: 'Cerrar Sesión'
        }
      },
      search: {
        results: 'Resultados de Búsqueda',
        noResults: 'No se encontraron resultados',
        placeholder: 'Ingrese término de búsqueda...'
      }
    }
  },
  fr: {
    translation: {
      title: 'Démo du Plugin I18n DevTools',
      greeting: 'Bonjour {{name}}!',
      examples: {
        basic: 'Traductions de Base',
        interpolation: 'Exemple d\'Interpolation',
        pluralization: 'Pluralisation'
      },
      common: {
        welcome: 'Bienvenue',
        button: {
          save: 'Enregistrer',
          cancel: 'Annuler',
          delete: 'Supprimer',
          edit: 'Modifier',
          search: 'Rechercher'
        },
        message: {
          loading: 'Chargement...',
          error: 'Une erreur s\'est produite',
          success: 'Opération réussie'
        },
        navigation: {
          home: 'Accueil',
          profile: 'Profil',
          settings: 'Paramètres',
          logout: 'Se Déconnecter'
        }
      },
      search: {
        results: 'Résultats de Recherche',
        noResults: 'Aucun résultat trouvé',
        placeholder: 'Entrez le terme de recherche...'
      }
    }
  },
  de: {
    translation: {
      title: 'I18n DevTools Plugin Demo',
      greeting: 'Hallo {{name}}!',
      examples: {
        basic: 'Grundlegende Übersetzungen',
        interpolation: 'Interpolations-Beispiel',
        pluralization: 'Pluralisierung'
      },
      common: {
        welcome: 'Willkommen',
        button: {
          save: 'Speichern',
          cancel: 'Abbrechen',
          delete: 'Löschen',
          edit: 'Bearbeiten',
          search: 'Suchen'
        },
        message: {
          loading: 'Lädt...',
          error: 'Ein Fehler ist aufgetreten',
          success: 'Operation erfolgreich'
        },
        navigation: {
          home: 'Startseite',
          profile: 'Profil',
          settings: 'Einstellungen',
          logout: 'Abmelden'
        }
      },
      search: {
        results: 'Suchergebnisse',
        noResults: 'Keine Ergebnisse gefunden',
        placeholder: 'Suchbegriff eingeben...'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;