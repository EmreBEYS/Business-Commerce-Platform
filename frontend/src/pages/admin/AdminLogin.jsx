import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";
import { API_URL } from "../../lib/catalogApi";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Giriş başarısız.");
        return;
      }

      navigate("/admin", { replace: true });
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-showcase">
        <a className="admin-login-brand" href="/"><img src="/serversatis-logo.png" alt="ServerSatış" /></a>
        <div className="admin-login-message">
          <span><i /> YÖNETİM MERKEZİ</span>
          <h1>Kataloğunuzun<br /><em>kontrol merkezi.</em></h1>
          <p>Ürünleri, kategorileri ve içerikleri güvenli bir panelden yönetin.</p>
          <div className="admin-login-features"><b>2.700+ ürün</b><b>Güvenli erişim</b><b>3 yönetici</b></div>
        </div>
        <small>© {new Date().getFullYear()} ServerSatış · Kurumsal teknoloji</small>
      </section>
      <section className="admin-login-form-side">
        <form className="admin-login-card" onSubmit={handleSubmit}>
          <div className="admin-login-header">
            <span className="admin-badge">YÖNETİCİ GİRİŞİ</span>
            <h2>Tekrar hoş geldiniz</h2>
            <p>Yönetim paneline erişmek için hesabınızla giriş yapın.</p>
          </div>

          <label>
            Kullanıcı adı
            <span className="admin-input-wrap"><i>♙</i><input type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="kullanici.adi" required /></span>
          </label>

          <label>
            Şifre
            <span className="admin-input-wrap"><i>◇</i><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••••" required /></span>
          </label>

          {error && <div className="admin-error">{error}</div>}

          <button className="admin-login-submit" type="submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : <>Panele Giriş Yap <span>→</span></>}
          </button>
          <p className="admin-login-security"><i>✓</i> Oturumunuz güvenli HTTP-only cookie ile korunur.</p>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;
