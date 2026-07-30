// Türkiye 81 il — coğrafi konumlu tile (kare) yerleşimi. Recharts harita çizmez; bağımlılık yok.
// Kesin sınır path'i yerine coğrafi-yaklaşık tilemap (batı→doğu = col, kuzey→güney = row).
// Choropleth: yoğunluğa göre fill; hover'da il adı + sayı (Portal tooltip).
export interface Province { code: string; name: string; col: number; row: number; }

export const TR_PROVINCES: Province[] = [
  // Marmara
  { code: '39', name: 'Kırklareli', col: 1, row: 0 }, { code: '81', name: 'Düzce', col: 4, row: 0 },
  { code: '22', name: 'Edirne', col: 0, row: 1 }, { code: '59', name: 'Tekirdağ', col: 1, row: 1 },
  { code: '34', name: 'İstanbul', col: 2, row: 1 }, { code: '41', name: 'Kocaeli', col: 3, row: 1 },
  { code: '54', name: 'Sakarya', col: 4, row: 1 }, { code: '14', name: 'Bolu', col: 5, row: 1 },
  { code: '77', name: 'Yalova', col: 2, row: 2 }, { code: '11', name: 'Bilecik', col: 3, row: 2 },
  { code: '17', name: 'Çanakkale', col: 0, row: 3 }, { code: '10', name: 'Balıkesir', col: 1, row: 3 },
  { code: '16', name: 'Bursa', col: 2, row: 3 },
  // Ege
  { code: '35', name: 'İzmir', col: 0, row: 4 }, { code: '45', name: 'Manisa', col: 1, row: 4 },
  { code: '43', name: 'Kütahya', col: 4, row: 3 }, { code: '64', name: 'Uşak', col: 3, row: 4 },
  { code: '03', name: 'Afyonkarahisar', col: 4, row: 4 }, { code: '09', name: 'Aydın', col: 0, row: 5 },
  { code: '20', name: 'Denizli', col: 2, row: 5 }, { code: '32', name: 'Isparta', col: 4, row: 5 },
  { code: '48', name: 'Muğla', col: 1, row: 6 }, { code: '15', name: 'Burdur', col: 3, row: 6 },
  // Akdeniz
  { code: '07', name: 'Antalya', col: 4, row: 7 }, { code: '46', name: 'Kahramanmaraş', col: 9, row: 6 },
  { code: '33', name: 'Mersin', col: 7, row: 7 }, { code: '01', name: 'Adana', col: 8, row: 7 },
  { code: '80', name: 'Osmaniye', col: 9, row: 7 }, { code: '31', name: 'Hatay', col: 9, row: 8 },
  // İç Anadolu
  { code: '26', name: 'Eskişehir', col: 5, row: 3 }, { code: '06', name: 'Ankara', col: 6, row: 2 },
  { code: '18', name: 'Çankırı', col: 7, row: 1 }, { code: '71', name: 'Kırıkkale', col: 7, row: 2 },
  { code: '40', name: 'Kırşehir', col: 7, row: 3 }, { code: '66', name: 'Yozgat', col: 8, row: 2 },
  { code: '50', name: 'Nevşehir', col: 8, row: 3 }, { code: '68', name: 'Aksaray', col: 7, row: 4 },
  { code: '51', name: 'Niğde', col: 8, row: 4 }, { code: '38', name: 'Kayseri', col: 9, row: 3 },
  { code: '42', name: 'Konya', col: 6, row: 5 }, { code: '70', name: 'Karaman', col: 6, row: 6 },
  { code: '58', name: 'Sivas', col: 10, row: 2 }, { code: '27', name: 'Gaziantep', col: 10, row: 6 },
  { code: '79', name: 'Kilis', col: 10, row: 7 },
  // Karadeniz
  { code: '67', name: 'Zonguldak', col: 5, row: 0 }, { code: '74', name: 'Bartın', col: 6, row: 0 },
  { code: '78', name: 'Karabük', col: 6, row: 1 }, { code: '37', name: 'Kastamonu', col: 7, row: 0 },
  { code: '57', name: 'Sinop', col: 8, row: 0 }, { code: '19', name: 'Çorum', col: 8, row: 1 },
  { code: '55', name: 'Samsun', col: 9, row: 0 }, { code: '05', name: 'Amasya', col: 9, row: 1 },
  { code: '60', name: 'Tokat', col: 10, row: 1 }, { code: '52', name: 'Ordu', col: 11, row: 0 },
  { code: '28', name: 'Giresun', col: 12, row: 0 }, { code: '61', name: 'Trabzon', col: 13, row: 0 },
  { code: '53', name: 'Rize', col: 14, row: 0 }, { code: '08', name: 'Artvin', col: 15, row: 0 },
  { code: '29', name: 'Gümüşhane', col: 12, row: 1 }, { code: '69', name: 'Bayburt', col: 13, row: 1 },
  // Doğu Anadolu
  { code: '24', name: 'Erzincan', col: 11, row: 2 }, { code: '25', name: 'Erzurum', col: 13, row: 2 },
  { code: '75', name: 'Ardahan', col: 15, row: 1 }, { code: '36', name: 'Kars', col: 15, row: 2 },
  { code: '76', name: 'Iğdır', col: 16, row: 2 }, { code: '62', name: 'Tunceli', col: 11, row: 3 },
  { code: '23', name: 'Elazığ', col: 12, row: 3 }, { code: '12', name: 'Bingöl', col: 13, row: 3 },
  { code: '49', name: 'Muş', col: 14, row: 3 }, { code: '04', name: 'Ağrı', col: 15, row: 3 },
  { code: '44', name: 'Malatya', col: 11, row: 4 }, { code: '13', name: 'Bitlis', col: 14, row: 4 },
  { code: '65', name: 'Van', col: 15, row: 4 }, { code: '30', name: 'Hakkari', col: 15, row: 5 },
  // Güneydoğu Anadolu
  { code: '02', name: 'Adıyaman', col: 11, row: 5 }, { code: '21', name: 'Diyarbakır', col: 12, row: 5 },
  { code: '72', name: 'Batman', col: 13, row: 5 }, { code: '56', name: 'Siirt', col: 14, row: 5 },
  { code: '63', name: 'Şanlıurfa', col: 11, row: 6 }, { code: '47', name: 'Mardin', col: 13, row: 6 },
  { code: '73', name: 'Şırnak', col: 14, row: 6 },
];

export const TR_GRID_COLS = 17;
export const TR_GRID_ROWS = 9;
