# GitHub'a Push Etme Rehberi

## Adım 1: Git Kurulumu

Eğer Git yüklü değilse:
1. https://git-scm.com/download/win adresinden Git'i indirin
2. Kurulumu tamamlayın
3. Terminal'i yeniden başlatın

## Adım 2: Git Repository Oluşturma

Proje klasörünüzde terminal açın ve şu komutları çalıştırın:

```bash
# Git repository'yi başlat
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "İlk commit: Mansfield Ziyaret Portalı"
```

## Adım 3: GitHub'da Repository Oluşturma

1. https://github.com adresine gidin
2. Sağ üstteki "+" butonuna tıklayın
3. "New repository" seçin
4. Repository adını girin (örn: `mansfield-ziyaret-portali`)
5. "Public" veya "Private" seçin
6. "Create repository" butonuna tıklayın
7. GitHub size bir URL verecek (örn: `https://github.com/kullaniciadi/mansfield-ziyaret-portali.git`)

## Adım 4: GitHub'a Push Etme

Terminal'de şu komutları çalıştırın:

```bash
# GitHub repository'yi remote olarak ekle
git remote add origin https://github.com/KULLANICIADI/REPO-ADI.git

# Ana branch'i main olarak ayarla
git branch -M main

# GitHub'a push et
git push -u origin main
```

**Not:** `KULLANICIADI` ve `REPO-ADI` kısımlarını kendi bilgilerinizle değiştirin.

## Adım 5: Güncellemeleri Push Etme

Gelecekte değişiklik yaptığınızda:

```bash
# Değişiklikleri kontrol et
git status

# Değişiklikleri ekle
git add .

# Commit yap
git commit -m "Değişiklik açıklaması"

# GitHub'a push et
git push
```

## Önemli Notlar

⚠️ **Güvenlik:** `supabase-config.js` dosyasında API key'leriniz var. 
- Public repository kullanıyorsanız, bu dosyayı `.gitignore`'a ekleyin
- Veya environment variable kullanmayı düşünün

## Sorun Giderme

**"git is not recognized" hatası:**
- Git'in PATH'e eklendiğinden emin olun
- Terminal'i yeniden başlatın

**"Permission denied" hatası:**
- GitHub'da authentication yapmanız gerekebilir
- Personal Access Token kullanın: https://github.com/settings/tokens

**"Repository not found" hatası:**
- Repository URL'ini kontrol edin
- GitHub'da repository'nin oluşturulduğundan emin olun

