# Mansfield Ziyaret Portalı

Müşteri ziyaretlerini yönetmek için geliştirilmiş web uygulaması.

## Özellikler

- ✅ Müşteri ziyareti kayıt sistemi
- ✅ Supabase veritabanı entegrasyonu
- ✅ Filtreleme ve arama
- ✅ PDF ve XLSX dışa aktarma
- ✅ POL/POD liman yönetimi
- ✅ Responsive tasarım

## Kurulum

1. Dosyaları bir web sunucusuna yükleyin veya yerel olarak açın
2. `supabase-config.js` dosyasında Supabase bağlantı bilgilerinizi güncelleyin
3. Supabase'de `visits` tablosunu oluşturun (tablo yapısı için SQL dosyasına bakın)

## Supabase Tablo Yapısı

```sql
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  phone text,
  modes text[],
  status text,
  priority text,
  ports text[],
  volume numeric,
  vol_unit text,
  visit_date date,
  follow_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

## Kullanım

1. Sayfayı açın
2. Şifre ile giriş yapın (varsayılan: 12345)
3. Yeni müşteri ziyareti ekleyin
4. Filtrelerle arama yapın
5. PDF veya XLSX olarak dışa aktarın

## Notlar

- Veriler Supabase veritabanında saklanır
- Supabase bağlantısı yoksa localStorage kullanılır (fallback)
- Admin modunda logo ve POL/POD listelerini yönetebilirsiniz

## Lisans

Yerel kullanım için geliştirilmiştir.

