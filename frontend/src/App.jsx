import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductsPage from "./pages/admin/ProductsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CorporatePage from "./pages/CorporatePage";
import ScrollToTop from "./components/ScrollToTop";
import SeoManager from "./components/SeoManager";
import LegalPage from "./pages/LegalPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./styles/storefront.css";
import "./styles/catalog.css";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SeoManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/katalog" element={<CatalogPage />} />
        <Route
          path="/kategori/network-ekipmanlar"
          element={<Navigate to="/kategori/network-ekipmanlari" replace />}
        />
        <Route path="/kategori/:categorySlug" element={<CatalogPage />} />
        <Route path="/urun/:id" element={<ProductDetailPage />} />
        <Route path="/hakkimizda" element={<CorporatePage type="about" />} />
        <Route path="/tedarik-sureci" element={<CorporatePage type="supply" />} />
        <Route path="/iletisim" element={<CorporatePage type="contact" />} />
        <Route path="/kvkk" element={<LegalPage type="kvkk" />} />
        <Route path="/gizlilik" element={<LegalPage type="privacy" />} />
        <Route path="/cerez-politikasi" element={<LegalPage type="cookies" />} />
        <Route path="/kullanim-kosullari" element={<LegalPage type="terms" />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
