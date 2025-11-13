// ====== Supabase Yapılandırması ======
const SUPABASE_CONFIG = {
  url: 'https://grqklcgxwmboedacobld.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWtsY2d4d21ib2VkYWNvYmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjc0NTUsImV4cCI6MjA3ODYwMzQ1NX0.8kUPsW6OtEZb-Dj0V83c0FcbhNyCnrbEZ3g6b_0dseo'
};

// Supabase client'ı başlat
let supabaseClient = null;

function initSupabase() {
  try {
    // Supabase kütüphanesinin yüklenip yüklenmediğini kontrol et
    if (typeof supabase === 'undefined') {
      console.warn('Supabase kütüphanesi henüz yüklenmedi. Sayfa yüklenene kadar bekleyin.');
      // 2 saniye sonra tekrar dene
      setTimeout(() => {
        if (typeof supabase !== 'undefined') {
          initSupabase();
        } else {
          console.error('Supabase kütüphanesi yüklenemedi. CDN bağlantısını kontrol edin.');
        }
      }, 2000);
      return null;
    }

    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase başarıyla başlatıldı:', SUPABASE_CONFIG.url);
    
    // Bağlantıyı test et (biraz gecikme ile, sayfa yüklendikten sonra)
    setTimeout(() => {
      testSupabaseConnection();
    }, 500);
    
    return supabaseClient;
  } catch (error) {
    console.error('❌ Supabase başlatılırken hata:', error);
    return null;
  }
}

// Bağlantı durumu göstergesini güncelle
function updateConnectionStatus(status, message) {
  const indicator = $('#statusIndicator');
  const text = $('#statusText');
  
  if (!indicator || !text) return;
  
  // Eski class'ları temizle
  indicator.classList.remove('connected', 'disconnected', 'checking');
  
  // Yeni durumu ayarla
  indicator.classList.add(status);
  text.textContent = message;
}

// Supabase bağlantısını test et
async function testSupabaseConnection() {
  try {
    updateConnectionStatus('checking', 'Bağlantı kontrol ediliyor...');
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ Supabase client mevcut değil');
      updateConnectionStatus('disconnected', 'Supabase bağlantısı yok (localStorage kullanılıyor)');
      return false;
    }
    
    // Basit bir test sorgusu - sadece bağlantıyı test et
    const { error } = await supabase
      .from('visits')
      .select('id')
      .limit(1);
    
    if (error) {
      // Tablo yoksa veya izin yoksa bu normal olabilir
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('⚠️ Supabase tablosu henüz oluşturulmamış veya izin yok:', error.message);
        updateConnectionStatus('disconnected', 'Tablo bulunamadı veya izin yok');
        return false;
      } else {
        console.warn('⚠️ Supabase bağlantı uyarısı:', error.message, error.code);
        updateConnectionStatus('disconnected', 'Bağlantı hatası: ' + error.message);
        return false;
      }
    } else {
      console.log('✅ Supabase bağlantısı başarılı');
      updateConnectionStatus('connected', 'Supabase bağlantısı aktif');
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase bağlantı testi başarısız:', error);
    console.error('Hata detayları:', error.message, error.stack);
    updateConnectionStatus('disconnected', 'Bağlantı hatası: ' + (error.message || 'Bilinmeyen hata'));
    return false;
  }
}

// Supabase client'ını döndür
function getSupabase() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

