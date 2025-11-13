// ====== Supabase Servis Katmanı ======
// Bu dosya tüm veritabanı işlemlerini yönetir

// ====== Veri Dönüşüm Fonksiyonları ======

/**
 * Supabase'den gelen veriyi (snake_case) JavaScript formatına (camelCase) dönüştür
 */
function fromSupabaseFormat(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(fromSupabaseFormat);
  }
  return {
    id: data.id,
    name: data.name,
    contact: data.contact || '',
    phone: data.phone || '',
    modes: data.modes || [],
    status: data.status || '',
    priority: data.priority || '',
    ports: data.ports || [],
    volume: data.volume || null,
    volUnit: data.vol_unit || '',
    visitDate: data.visit_date || null,
    followDate: data.follow_date || null,
    notes: data.notes || '',
    createdAt: data.created_at || null,
    // Eksik alanlar için varsayılanlar (eski kod uyumluluğu için)
    tags: [],
    needQuote: false,
    baseNote: data.notes || '',
    updateNote: '',
    updatedAt: null,
    ver: 1
  };
}

/**
 * JavaScript formatındaki veriyi (camelCase) Supabase formatına (snake_case) dönüştür
 * NOT: id alanı dahil edilmez - Supabase otomatik oluşturur
 */
function toSupabaseFormat(data) {
  // id ve created_at alanlarını kesinlikle dahil etme - Supabase otomatik oluşturur
  // Sadece gerekli alanları al
  const result = {};
  
  // Sadece Supabase tablosunda olan alanları ekle
  if (data.name !== undefined) result.name = data.name;
  if (data.contact !== undefined) result.contact = data.contact || null;
  if (data.phone !== undefined) result.phone = data.phone || null;
  if (data.modes !== undefined) result.modes = data.modes || [];
  if (data.status !== undefined) result.status = data.status || null;
  if (data.priority !== undefined) result.priority = data.priority || null;
  if (data.ports !== undefined) result.ports = data.ports || [];
  if (data.volume !== undefined) result.volume = data.volume || null;
  if (data.volUnit !== undefined) result.vol_unit = data.volUnit || null;
  if (data.visitDate !== undefined) result.visit_date = data.visitDate || null;
  if (data.followDate !== undefined) result.follow_date = data.followDate || null;
  if (data.notes !== undefined) result.notes = data.notes || null;
  
  // Kesinlikle id ve created_at alanlarını ekleme
  delete result.id;
  delete result.created_at;
  delete result.updated_at;
  
  return result;
}

// ====== Ziyaretler (Visits) İşlemleri ======

/**
 * Tüm ziyaretleri getir
 */
async function getVisits() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase bağlantısı yok, localStorage kullanılıyor');
      return load(STORAGE.visits, []);
    }

    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ziyaretler getirilirken hata:', error);
      // Fallback: localStorage'dan oku
      return load(STORAGE.visits, []);
    }

    // Veriyi JavaScript formatına dönüştür
    return fromSupabaseFormat(data) || [];
  } catch (error) {
    console.error('getVisits hatası:', error);
    return load(STORAGE.visits, []);
  }
}

/**
 * Yeni ziyaret ekle
 */
async function createVisit(visitData) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      // Fallback: localStorage
      const list = load(STORAGE.visits, []);
      visitData.id = nextId(list);
      visitData.ver = 1;
      visitData.baseNote = visitData.notes || '';
      visitData.updateNote = '';
      const newList = [visitData, ...list];
      save(STORAGE.visits, newList);
      return visitData;
    }

    // Veriyi Supabase formatına dönüştür
    const supabaseData = toSupabaseFormat(visitData);
    
    // id alanını kesinlikle kaldır (Supabase otomatik oluşturur)
    delete supabaseData.id;
    delete supabaseData.created_at; // created_at de otomatik oluşturulur
    
    // Debug: Gönderilen veriyi kontrol et
    console.log('Supabase\'e gönderilen veri:', JSON.stringify(supabaseData, null, 2));
    console.log('id alanı var mı?', 'id' in supabaseData);

    // Supabase'e kaydet
    const { data, error } = await supabase
      .from('visits')
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error('Ziyaret eklenirken hata:', error);
      throw error;
    }

    // Dönen veriyi JavaScript formatına dönüştür
    return fromSupabaseFormat(data);
  } catch (error) {
    console.error('createVisit hatası:', error);
    throw error;
  }
}

/**
 * Ziyaret güncelle
 */
async function updateVisit(id, updateData) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      // Fallback: localStorage
      const list = load(STORAGE.visits, []);
      const index = list.findIndex(v => v.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updateData };
        save(STORAGE.visits, list);
        return list[index];
      }
      return null;
    }

    // Veriyi Supabase formatına dönüştür
    const supabaseData = toSupabaseFormat(updateData);

    const { data, error } = await supabase
      .from('visits')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ziyaret güncellenirken hata:', error);
      throw error;
    }

    // Dönen veriyi JavaScript formatına dönüştür
    return fromSupabaseFormat(data);
  } catch (error) {
    console.error('updateVisit hatası:', error);
    throw error;
  }
}

/**
 * Ziyaret sil
 */
async function deleteVisit(id) {
  try {
    if (!id) {
      console.error('deleteVisit: id parametresi eksik');
      throw new Error('Ziyaret ID\'si bulunamadı');
    }

    console.log('deleteVisit çağrıldı, ID:', id);
    
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase bağlantısı yok, localStorage\'dan siliniyor');
      // Fallback: localStorage
      const list = load(STORAGE.visits, []);
      const filtered = list.filter(v => v.id !== id);
      save(STORAGE.visits, filtered);
      return true;
    }

    console.log('Supabase\'den siliniyor, ID:', id);
    
    const { data, error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Ziyaret silinirken hata:', error);
      console.error('Hata detayları:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Ziyaret başarıyla silindi:', data);
    return true;
  } catch (error) {
    console.error('deleteVisit hatası:', error);
    throw error;
  }
}

// ====== Hızlı Bağlantılar (Links) İşlemleri ======

/**
 * Tüm bağlantıları getir
 */
async function getLinks() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return load(STORAGE.links, [
        { text: 'Outlook', url: 'https://outlook.office.com' },
        { text: 'CMA CGM eBusiness', url: 'https://www.cma-cgm.com/eBusiness' },
        { text: 'Maersk', url: 'https://www.maersk.com/' }
      ]);
    }

    const { data, error } = await supabase
      .from('links') // Tablo adını buraya yazın
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Bağlantılar getirilirken hata:', error);
      return load(STORAGE.links, []);
    }

    return data || [];
  } catch (error) {
    console.error('getLinks hatası:', error);
    return load(STORAGE.links, []);
  }
}

/**
 * Yeni bağlantı ekle
 */
async function createLink(linkData) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      const links = load(STORAGE.links, []);
      links.push(linkData);
      save(STORAGE.links, links);
      return linkData;
    }

    const { data, error } = await supabase
      .from('links')
      .insert([linkData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('createLink hatası:', error);
    throw error;
  }
}

/**
 * Bağlantı güncelle
 */
async function updateLink(id, updateData) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      const links = load(STORAGE.links, []);
      const index = links.findIndex(l => l.id === id);
      if (index !== -1) {
        links[index] = { ...links[index], ...updateData };
        save(STORAGE.links, links);
        return links[index];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('updateLink hatası:', error);
    throw error;
  }
}

/**
 * Bağlantı sil
 */
async function deleteLink(id) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      const links = load(STORAGE.links, []);
      const filtered = links.filter(l => l.id !== id);
      save(STORAGE.links, filtered);
      return true;
    }

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('deleteLink hatası:', error);
    throw error;
  }
}

// ====== Ayarlar (Settings) İşlemleri ======
// POL/POD listeleri ve logo için

/**
 * Ayar getir
 */
async function getSetting(key) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return load(STORAGE[key], null);
    }

    const { data, error } = await supabase
      .from('settings') // Tablo adını buraya yazın
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      // Ayar bulunamadı, localStorage'dan oku
      return load(STORAGE[key], null);
    }

    return data?.value || null;
  } catch (error) {
    console.error('getSetting hatası:', error);
    return load(STORAGE[key], null);
  }
}

/**
 * Ayar kaydet/güncelle
 */
async function setSetting(key, value) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      save(STORAGE[key], value);
      return true;
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    
    // Cache için localStorage'a da kaydet
    save(STORAGE[key], value);
    return true;
  } catch (error) {
    console.error('setSetting hatası:', error);
    // Fallback: localStorage
    save(STORAGE[key], value);
    return false;
  }
}

