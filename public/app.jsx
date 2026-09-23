const { useState, useEffect, useRef } = React;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('normal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Tabs
  const [tabMode, setTabMode] = useState('system'); // 'system' or 'excel'

  // System Tab State
  const [promoType, setPromoType] = useState('Niêm yết');
  const [promoMonth, setPromoMonth] = useState('');
  const [months, setMonths] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [systemData, setSystemData] = useState([]);
  
  // Special Size Selector
  const [promoSize, setPromoSize] = useState('A6');

  // Search state (for specific product search, optional now but keep for manual adding if needed)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Manual Input state
  const [inputMode, setInputMode] = useState('search');
  const [manualForm, setManualForm] = useState({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', discountAmount: '', location: '', supplier: '', type: '', unit: '', dateRange: '', promoContent: '' });
  const [editingId, setEditingId] = useState(null);

  // Print Configuration
  const [paperSize, setPaperSize] = useState('A4_portrait');
  const [loadedBarcodes, setLoadedBarcodes] = useState(new Set());

  // Fetch months
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await fetch('/api/months');
        if (response.ok) {
          const data = await response.json();
          setMonths(data);
          if (data.length > 0) setPromoMonth(data[0]);
        }
      } catch (err) {
        console.error('Error fetching months:', err);
      }
    };
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };
    fetchMonths();
    fetchStores();
  }, []);

  useEffect(() => {
    if (promoType === 'Niêm yết') setSelectedTemplate('normal');
    else if (promoType === 'Discount') setSelectedTemplate('sale');
  }, [promoType]);

  // Fetch data from API based on search query (for autocomplete)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?q=' + encodeURIComponent(searchQuery));
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchProducts();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    const cleanAmount = String(amount).replace(/,/g, '');
    const num = Number(cleanAmount);
    return isNaN(num) ? 'NaN' : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getDiscountPercent = (price, original) => {
    const p = Number(String(price).replace(/,/g, ''));
    const o = Number(String(original).replace(/,/g, ''));
    if (!o || p >= o) return 0;
    return Math.round(((o - p) / o) * 100);
  };

  const addToQueue = (product) => {
    setProducts(prev => {
        const existing = prev.find(p => p.barcode === product.barcode);
        if (existing) {
            return prev.map(p => p.barcode === product.barcode ? { ...p, quantity: p.quantity + 1 } : p);
        }
        return [...prev, { ...product, quantity: 1, id: Date.now().toString() }];
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const addMultipleToQueue = (items) => {
    setProducts(prev => {
      const merged = [...prev];
      items.forEach(ip => {
          const existing = merged.find(m => m.barcode === ip.barcode);
          if (existing) { existing.quantity += 1; } 
          else { merged.push({...ip, quantity: 1, id: `imported-${Date.now()}-${Math.random()}`}); }
      });
      return merged;
    });
  };

  const handleSystemSearch = async () => {
    try {
      let url = '/api/products';
      if (promoType !== 'Niêm yết') {
        const selectedStoreData = stores.find(s => s.store_name === selectedStore);
        const layer02 = selectedStoreData ? selectedStoreData.layer02 : '';
        url = `/api/promotions?month=${encodeURIComponent(promoMonth)}&type=${encodeURIComponent(promoType)}`;
        if (selectedStore) {
            url += `&store_name=${encodeURIComponent(selectedStore)}&store_layer02=${encodeURIComponent(layer02)}`;
        }
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Map database fields to app state fields
        const mappedData = data.map(p => ({
          barcode: p.barcode || '',
          name: p.item_name || p.name || '',
          originalPrice: p.retail_price || p.originalPrice || '',
          price: p.promo_price || p.price || '',
          dateRange: p.dateRange || (parseDateValue(p.start_date) ? `${parseDateValue(p.start_date)} - ${parseDateValue(p.end_date)}` : ''),
          promoContent: p.promo_content || p.type || '',
          discountPercent: p.discount_percent || p.discountPercent || '',
          discountAmount: p.discount_amount || p.discountAmount || '',
          unit: p.unit || p.uom || ''
        }));

        setSystemData(mappedData);
        addMultipleToQueue(mappedData);
        alert(`Đã lấy ${mappedData.length} sản phẩm.`);
      }
    } catch (err) {
      console.error('Error fetching system data:', err);
    }
  };

  const parseDateValue = (val) => {
    if (!val) return '';
    // Handle Lark timestamp (13 digits)
    if (typeof val === 'string' && /^\d{13}$/.test(val)) {
      const d = new Date(parseInt(val, 10));
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    // Handle Excel serial date (e.g., 45139)
    if (typeof val === 'number' && val > 10000 && val < 99999) {
      const d = new Date((val - 25569) * 86400 * 1000);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    return val;
  };

  const handleExportExcel = async () => {
    if (!window.XLSX) return alert("Thư viện Excel chưa được tải.");
    
    let itemsToExport = [];
    try {
      let url = '/api/products';
      if (promoType !== 'Niêm yết') {
        const selectedStoreData = stores.find(s => s.store_name === selectedStore);
        const layer02 = selectedStoreData ? selectedStoreData.layer02 : '';
        url = `/api/promotions?month=${encodeURIComponent(promoMonth)}&type=${encodeURIComponent(promoType)}`;
        if (selectedStore) {
            url += `&store_name=${encodeURIComponent(selectedStore)}&store_layer02=${encodeURIComponent(layer02)}`;
        }
      }
      const response = await fetch(url);
      if (response.ok) {
        itemsToExport = await response.json();
      } else {
        return alert("Lỗi khi tải dữ liệu từ máy chủ!");
      }
    } catch (err) {
      console.error(err);
      return alert("Không thể kết nối tới máy chủ.");
    }

    if (itemsToExport.length === 0) {
      return alert("Không có dữ liệu cho điều kiện này.");
    }

    const wsData = [
      ["Barcode", "Tên SP", "Giá cũ", "Giá mới", "Ngày bắt đầu", "Ngày kết thúc", "Nội dung CTKM", "USP"]
    ];

    itemsToExport.forEach(p => {
      // API returns snake_case from DB for promotions, or camelCase for items
      const barcode = p.barcode || '';
      const name = p.item_name || p.name || '';
      const originalPrice = p.retail_price || p.originalPrice || '';
      const newPrice = p.promo_price || p.price || '';
      const startDate = parseDateValue(p.start_date || p.dateRange?.split(' - ')[0]);
      const endDate = parseDateValue(p.end_date || p.dateRange?.split(' - ')[1]);
      const content = p.promo_content || p.type || '';
      const usp = p.usp || '';

      wsData.push([barcode, name, originalPrice, newPrice, startDate, endDate, content, usp]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "DanhSachTem");
    window.XLSX.writeFile(wb, `DS_${promoType}_${promoMonth || ''}.xlsx`);
  };

  const handleFieldChange = (field, value) => {
      setManualForm(prev => ({ ...prev, [field]: value }));
      if (editingId) {
          setProducts(prev => prev.map(p => p.id === editingId ? { ...p, [field]: value } : p));
      }
  };

  const handleManualAdd = (e) => {
      e.preventDefault();
      if (!manualForm.name || !manualForm.price || !manualForm.barcode) return;
      
      if (editingId) {
          setEditingId(null);
          setInputMode('search');
      } else {
          addToQueue(manualForm);
      }
      setManualForm({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', discountAmount: '', location: '', supplier: '', type: '', unit: '', dateRange: '', promoContent: '' });
  };

  const handleDownloadTemplate = () => {
    if (!window.XLSX) return alert("Thư viện Excel đang được tải...");
    const ws = window.XLSX.utils.aoa_to_sheet([
      ["Tên sản phẩm", "Giá bán", "Mã vạch", "Giá gốc", "% Giảm", "Đơn vị", "Đặc điểm (USP)", "Hạn áp dụng", "Nội dung CTKM"],
      ["Sữa tắm Kose", 259000, "4971710311556", 300000, 10, "/Chai", "Dưỡng ẩm da", "01/07 - 31/07", "Mua 1 tặng 1"]
    ]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Template");
    window.XLSX.writeFile(wb, "mau_import_tem.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.XLSX) return alert("Thư viện Excel đang được tải...");
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = window.XLSX.utils.sheet_to_json(ws);
      
      const importedProducts = data.map((row, idx) => {
        const start = parseDateValue(row["Ngày bắt đầu"]);
        const end = parseDateValue(row["Ngày kết thúc"]);
        const han = parseDateValue(row["Hạn áp dụng"]);
        
        return {
          id: `imported-${Date.now()}-${idx}`,
          name: row["Tên SP"] || row["Tên sản phẩm"] || '',
          price: row["Giá mới"] || row["Giá bán"] || '',
          barcode: row["Barcode"] || row["Mã vạch"] || '',
          originalPrice: row["Giá cũ"] || row["Giá gốc"] || '',
          discountPercent: row["% Giảm"] || '',
          unit: row["Đơn vị"] || '',
          type: row["USP"] || row["Đặc điểm (USP)"] || '',
          dateRange: han || (start ? `${start} - ${end}` : ''),
          promoContent: row["Nội dung CTKM"] || '',
          discountAmount: row["Tiền giảm"] || row["Tiết kiệm"] || row["discount_amount"] || '',
          quantity: 1
        };
      }).filter(p => p.name && p.barcode);

      if (importedProducts.length > 0) {
        addMultipleToQueue(importedProducts);
        alert(`Đã import thành công ${importedProducts.length} sản phẩm!`);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
      }
      e.target.value = null; // Reset input
    };
    reader.readAsBinaryString(file);
  };

  const editProduct = (product) => {
      setInputMode('manual');
      setManualForm({ 
          name: product.name || '', price: product.price || '', barcode: product.barcode || '', 
          originalPrice: product.originalPrice || '', discountPercent: product.discountPercent !== undefined ? product.discountPercent : '',
          discountAmount: product.discountAmount !== undefined ? product.discountAmount : '',
          location: product.location || '', supplier: product.supplier || '', type: product.type || '', 
          unit: product.unit || '', dateRange: product.dateRange || '', promoContent: product.promoContent || ''
      });
      setEditingId(product.id);
  };

  const cancelEdit = () => {
      setEditingId(null);
      setManualForm({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', discountAmount: '', location: '', supplier: '', type: '', unit: '', dateRange: '', promoContent: '' });
      setInputMode('search');
  };

  const updateQuantity = (id, delta) => {
      setProducts(prev => prev.map(p => {
          if (p.id === id) return { ...p, quantity: Math.max(1, p.quantity + delta) };
          return p;
      }));
  };

  const setExactQuantity = (id, value) => {
      const num = parseInt(value) || 1;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: Math.max(1, num) } : p));
  };

  const removeProduct = (id) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editingId === id) cancelEdit();
  };

  const getTagsToRender = () => {
      const tags = [];
      products.forEach(product => {
          const currentProduct = (editingId === product.id) ? { ...product, ...manualForm } : product;
          for (let i = 0; i < product.quantity; i++) {
              tags.push({ ...currentProduct, renderId: `${product.id}-${i}` });
          }
      });
      return tags;
  };

  const paperDimensions = {
      'A4_portrait': { w: 794, h: 1123, css: 'A4 portrait' }
  };
  
  const currentPaper = paperDimensions[paperSize];
  let pagePadding = { x: 20, y: 30 }; 
  let tagGap = 2; 
  let baseTag = { w: 600, h: 350 };
  
  let scaledTagWidth = 0;
  let scaledTagHeight = 0;
  let scaleFactor = 1;

  const isSpecialPromo = !['Niêm yết', 'Discount'].includes(promoType);

  if (!isSpecialPromo) {
    let targetWidthMm = 60;
    let targetHeightMm = 35;
    if (selectedTemplate === 'normal_usp' || selectedTemplate === 'sale_usp') {
        baseTag = { w: 800, h: 700 };
        targetWidthMm = 80;
        targetHeightMm = 70;
    } else if (selectedTemplate === 'normal_small') {
        baseTag = { w: 600, h: 300 };
        targetWidthMm = 50;
        targetHeightMm = 24.15;
    } else if (selectedTemplate === 'sale_50x80') {
        baseTag = { w: 500, h: 800 };
        targetWidthMm = 50;
        targetHeightMm = 80;
        pagePadding = { x: 15, y: 20 };
        tagGap = 2;
    }
    const pxPerMm = 96 / 25.4;
    scaledTagWidth = targetWidthMm * pxPerMm;
    scaleFactor = scaledTagWidth / baseTag.w;
    scaledTagHeight = baseTag.h * scaleFactor;
  } else {
    pagePadding = { x: 0, y: 0 };
    tagGap = 0;
    const logicalW = 1000;
    if (promoSize === 'A5') { 
       scaledTagWidth = currentPaper.w;
       scaledTagHeight = currentPaper.h / 2;
       baseTag = { w: logicalW, h: logicalW * (148.5 / 210) };
    } else if (promoSize === 'A6') { 
       scaledTagWidth = currentPaper.w / 2;
       scaledTagHeight = currentPaper.h / 2;
       baseTag = { w: logicalW, h: logicalW * (148.5 / 105) };
    } else if (promoSize === 'A7') { 
       scaledTagWidth = currentPaper.w / 2;
       scaledTagHeight = currentPaper.h / 4;
       baseTag = { w: logicalW, h: logicalW * (74.25 / 105) };
    }
    scaleFactor = scaledTagWidth / baseTag.w;
  }

  const availableWidth = currentPaper.w - (pagePadding.x * 2);
  let tagsPerRow = Math.floor((availableWidth + tagGap) / (scaledTagWidth + tagGap));
  if (tagsPerRow < 1) tagsPerRow = 1;

  const availableHeight = currentPaper.h - (pagePadding.y * 2);
  let rowsPerPage = Math.floor((availableHeight + tagGap) / (scaledTagHeight + tagGap));
  if (rowsPerPage < 1) rowsPerPage = 1; 
  const itemsPerPage = rowsPerPage * tagsPerRow;

  const getPaginatedTags = () => {
      const tags = getTagsToRender();
      const pages = [];
      for (let i = 0; i < tags.length; i += itemsPerPage) {
          pages.push(tags.slice(i, i + itemsPerPage));
      }
      return pages;
  };

  const uniqueBarcodes = React.useMemo(() => {
    if (isSpecialPromo || selectedTemplate === 'sale_50x80') return [];
    return [...new Set(products.map(p => p.barcode).filter(Boolean))];
  }, [products, isSpecialPromo, selectedTemplate]);

  const loadedBarcodesCount = uniqueBarcodes.filter(bc => loadedBarcodes.has(bc)).length;
  const totalBarcodesCount = uniqueBarcodes.length;
  const isAllBarcodesLoaded = isSpecialPromo || selectedTemplate === 'sale_50x80' || totalBarcodesCount === 0 || loadedBarcodesCount >= totalBarcodesCount;

  // Preloader chạy nền bằng nhiều luồng đồng thời
  useEffect(() => {
    if (uniqueBarcodes.length === 0) return;

    let isMounted = true;
    let scale = 5, bcHeight = 10, textsize = 10;
    if (selectedTemplate === 'normal_small') {
      scale = 6; bcHeight = 8; textsize = 8;
    } else if (selectedTemplate === 'sale') {
      scale = 4; bcHeight = 14; textsize = 15;
    } else if (selectedTemplate === 'sale_usp') {
      scale = 5; bcHeight = 16; textsize = 15;
    }

    const queue = uniqueBarcodes.filter(bc => !loadedBarcodes.has(bc));
    if (queue.length === 0) return;

    const runWorker = async () => {
      while (queue.length > 0 && isMounted) {
        const bc = queue.shift();
        if (!bc) break;
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (isMounted) {
              setLoadedBarcodes(prev => {
                const next = new Set(prev);
                next.add(bc);
                return next;
              });
            }
            resolve();
          };
          img.onerror = () => {
            if (isMounted) {
              setLoadedBarcodes(prev => {
                const next = new Set(prev);
                next.add(bc);
                return next;
              });
            }
            resolve();
          };
          img.src = `/api/barcode?text=${encodeURIComponent(bc)}&scale=${scale}&height=${bcHeight}${textsize ? `&textsize=${textsize}` : ''}`;
        });
      }
    };

    // Chạy 8 luồng tải song song cực nhanh
    for (let i = 0; i < 8; i++) {
      runWorker();
    }

    return () => {
      isMounted = false;
    };
  }, [uniqueBarcodes, selectedTemplate]);

  const BarcodeImage = ({ barcode, className = "h-24", scale = 4, bcHeight = 16, textsize = '' }) => (
      <img 
          src={`/api/barcode?text=${encodeURIComponent(barcode)}&scale=${scale}&height=${bcHeight}${textsize ? `&textsize=${textsize}` : ''}`} 
          alt="barcode" 
          className={`${className} w-full object-contain mix-blend-multiply`} 
          crossOrigin="anonymous" 
          onLoad={() => {
            if (barcode && !loadedBarcodes.has(barcode)) {
              setLoadedBarcodes(prev => {
                const next = new Set(prev);
                next.add(barcode);
                return next;
              });
            }
          }}
      />
  );

  const getTitleSize = (name, baseSize) => {
      const len = name ? name.length : 0;
      if (baseSize === 28) {
          if (len > 45) return { c: 'line-clamp-3', s: '28px' };
          return { c: 'line-clamp-2', s: '28px' };
      }
      if (baseSize === 30) {
          if (len > 45) return { c: 'line-clamp-3', s: '30px' };
          return { c: 'line-clamp-2', s: '30px' };
      }
      if (baseSize === 38) {
          if (len > 45) return { c: 'line-clamp-3', s: '38px' };
          return { c: 'line-clamp-2', s: '38px' };
      }
      if (baseSize === 60) {
          if (len > 75) return { c: 'line-clamp-3', s: '50px' };
          if (len > 45) return { c: 'line-clamp-3', s: '55px' };
          return { c: 'line-clamp-2', s: '60px' };
      }
      return { c: 'line-clamp-2', s: `${baseSize}px` };
  };

  // 1. Tem Niêm yết (60x35mm)
  const TemplateNormal = ({ product }) => (
    <div className="w-full h-full bg-white rounded-3xl border-[5px] border-gray-400 px-4 py-3 flex flex-col justify-between overflow-hidden shadow-sm box-border relative">
      <div className="text-center w-full flex items-center justify-center min-h-[90px]">
        <h3 className={`text-[#10285B] font-bold leading-tight break-words ${getTitleSize(product.name, 30).c}`} style={{ fontSize: getTitleSize(product.name, 30).s, overflowWrap: 'anywhere' }}>{product.name}</h3>
      </div>
      <div className="text-center w-full flex-1 flex items-center justify-center">
         <span className="text-black font-bold text-[85px] tracking-tight leading-none">{formatCurrency(product.price)} <span className="text-[55px]">đ</span></span>
      </div>
      <div className="flex justify-center items-end mt-auto w-full h-[100px] shrink-0">
          <BarcodeImage barcode={product.barcode} className="h-full w-full" scale={5} bcHeight={10} textsize={10} />
      </div>
    </div>
  );

  // 1b. Tem Niêm yết Nhỏ (50x24mm)
  const TemplateNormalSmall = ({ product }) => (
    <div className="w-full h-full bg-white rounded-2xl border-[4px] border-gray-400 px-3 py-2 flex flex-col justify-between overflow-hidden shadow-sm box-border relative">
      <div className="text-center w-full flex items-center justify-center min-h-[70px]">
        <h3 className={`text-[#10285B] font-bold leading-tight break-words ${getTitleSize(product.name, 30).c}`} style={{ fontSize: getTitleSize(product.name, 30).s, overflowWrap: 'anywhere' }}>{product.name}</h3>
      </div>
      <div className="text-center w-full flex-1 flex items-center justify-center">
         <span className="text-black font-bold tracking-tight" style={{ fontSize: '60px', lineHeight: '1' }}>{formatCurrency(product.price)} <span style={{ fontSize: '40px' }}>đ</span></span>
      </div>
      <div className="w-full flex-1 flex justify-center items-end pb-1 overflow-hidden mt-1 px-2 h-[85px]">
        <BarcodeImage barcode={product.barcode} className="h-full w-full" scale={6} bcHeight={8} textsize={8} />
      </div>
    </div>
  );

  // 2. Tem Niêm yết có USP (700x800)
  const TemplateNormalUSP = ({ product }) => (
    <div className="w-full h-full bg-white rounded-[40px] border-[5px] border-gray-400 p-10 flex flex-col justify-between overflow-hidden shadow-sm box-border relative">
      <div className="text-center w-full pt-4">
        <h3 className={`text-[#10285B] font-bold leading-tight break-words ${getTitleSize(product.name, 60).c}`} style={{ fontSize: getTitleSize(product.name, 60).s, overflowWrap: 'anywhere' }}>{product.name}</h3>
      </div>
      <div className="text-center w-full mt-4">
         <span className="text-black font-bold text-[140px] tracking-tight">{formatCurrency(product.price)} <span className="text-[90px]">đ</span></span>
      </div>
      <div className="flex justify-between items-end mt-auto w-full pt-4 gap-4">
          {product.type ? (
              <div className="font-bold text-[36px] text-black flex-1 min-w-0 max-h-[140px] overflow-hidden flex items-end leading-tight pb-2 break-words" style={{ overflowWrap: 'anywhere' }}>
                  <span className="line-clamp-3 w-full">*{product.type}</span>
              </div>
          ) : (
              <div className="flex-1"></div>
          )}
          <div className="flex flex-col items-end shrink-0 max-w-[50%]">
              <BarcodeImage barcode={product.barcode} className="h-[155px] w-full" scale={5} bcHeight={18} textsize={16} />
          </div>
      </div>
    </div>
  );

  // 3. Tem Khuyến Mại Thường (350x600) - KHÔNG USP
  const TemplateSale = ({ product }) => {
    let discount = getDiscountPercent(product.price, product.originalPrice);
    if (product.discountPercent) discount = parseInt(product.discountPercent, 10) || discount;
    let priceMain = formatCurrency(product.price);
    let priceSub = "đ";
    const priceStr = product.price.toString();
    if (priceStr.endsWith('000') && priceStr.length > 3) {
        priceMain = formatCurrency(parseInt(priceStr.slice(0, -3)));
        priceSub = ".000đ";
    }

    let showPromoText = false;
    let ribbonSub = discount + '%';
    
    if (product.promoContent) {
        const pc = product.promoContent.trim().toLowerCase();
        if (/^(giảm\s*)?\d+%$/.test(pc)) {
            ribbonSub = product.promoContent.replace(/[^\d%]/g, '');
        } else {
            showPromoText = true;
        }
    }

    return (
      <div className="w-full h-full bg-white border-[4px] border-black flex flex-col overflow-hidden box-border relative">
        <div className="bg-black text-white text-center font-black text-[55px] uppercase tracking-widest py-1 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        <div className="px-6 pt-1 pb-0 text-center font-bold text-[26px] text-black line-clamp-2 break-words shrink-0 leading-tight min-h-[66px]" style={{ overflowWrap: 'anywhere' }}>
          {product.name}
        </div>
        
        <div className="flex-1 min-h-0 px-6 flex items-start justify-between relative mt-1">
           {showPromoText ? (
              <div className="relative flex flex-col items-center justify-center w-[185px] shrink-0 border-[3px] border-black bg-white px-2 py-1 min-h-[60px] max-h-[85px] self-start mt-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <span className={`text-black font-bold leading-tight text-center break-words w-full uppercase ${(product.promoContent || '').length > 45 ? 'text-[13px]' : 'text-[14px]'}`}>
                      {product.promoContent}
                  </span>
              </div>
           ) : discount > 0 || ribbonSub !== '0%' ? (
              <div className="relative flex flex-col items-center justify-center w-[90px] h-[110px] shrink-0 mt-1">
                  <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                      <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                  </svg>
                  <span className="relative z-10 text-white font-bold text-[18px] leading-none uppercase mt-[-10px]">Giảm</span>
                  <span className="relative z-10 text-white font-black leading-none mt-1 text-[38px] tracking-tighter">{ribbonSub}</span>
              </div>
           ) : (
              <div className="w-[90px] shrink-0"></div>
           )}
           <div className="flex flex-col items-end justify-start flex-1 ml-3 overflow-hidden relative top-[0px]">
              <div className="flex items-baseline text-black justify-end w-full mt-1">
                  <span className={`font-black tracking-tighter leading-none shrink-0 ${priceMain.length > 7 ? 'text-[65px]' : priceMain.length > 5 ? 'text-[80px]' : 'text-[95px]'}`} style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>{priceMain}</span>
                  <span className={`font-bold ml-1 shrink-0 ${priceMain.length > 5 ? 'text-[32px]' : 'text-[40px]'}`}>{priceSub}</span>
              </div>
              <div className="text-right text-black text-[30px] shrink-0 leading-tight mt-1">
                 {product.originalPrice ? (
                     <span>Giá niêm yết: <span className="line-through">{formatCurrency(product.originalPrice)}đ</span></span>
                 ) : (
                     <span>&nbsp;</span>
                 )}
              </div>
           </div>
        </div>
        
        <div className="mx-4 mt-auto mb-2 flex items-end">
            <div className="w-[195px] shrink-0">
                <BarcodeImage barcode={product.barcode} className="h-[80px] ml-[-10px]" scale={4} bcHeight={14} textsize={15} />
            </div>
            <div className="flex-1 flex justify-between items-end border-t-[3px] border-black pb-1 pt-1 ml-2 text-[18px] font-bold text-black">
               <div className="text-center flex-1 px-2 whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                  {product.dateRange ? `Áp dụng ${product.dateRange}` : 'Áp dụng 01/07 - 31/07'}
               </div>
               {product.unit ? (
                  <div className="text-right min-w-[50px] mb-1">
                     {product.unit.startsWith('/') ? product.unit : `/${product.unit}`}
                  </div>
               ) : null}
            </div>
        </div>
      </div>
    );
  };

  // 4. Tem Khuyến Mại có USP (700x800)
  const TemplateSaleUSP = ({ product }) => {
    let discount = getDiscountPercent(product.price, product.originalPrice);
    if (product.discountPercent) discount = parseInt(product.discountPercent, 10) || discount;
    let priceMain = formatCurrency(product.price);
    let priceSub = "đ";
    const priceStr = product.price.toString();
    if (priceStr.endsWith('000') && priceStr.length > 3) {
        priceMain = formatCurrency(parseInt(priceStr.slice(0, -3)));
        priceSub = ".000đ";
    }

    let showPromoText = false;
    let ribbonSub = discount + '%';
    
    if (product.promoContent) {
        const pc = product.promoContent.trim().toLowerCase();
        if (/^(giảm\s*)?\d+%$/.test(pc)) {
            ribbonSub = product.promoContent.replace(/[^\d%]/g, '');
        } else {
            showPromoText = true;
        }
    }

    return (
      <div className="w-full h-full bg-white border-[5px] border-black flex flex-col overflow-hidden box-border relative">
        <div className="bg-black text-white text-center font-black text-[80px] uppercase tracking-widest py-2 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        <div className="px-6 pt-2 pb-0 text-center font-bold text-[28px] text-black line-clamp-2 break-words shrink-0 leading-tight min-h-[72px]" style={{ overflowWrap: 'anywhere' }}>
          {product.name}
        </div>
        
        <div className="flex-1 min-h-0 px-4 flex flex-col items-center justify-start relative mt-1">
           <div className="flex w-full justify-between items-start">
               {showPromoText ? (
                  <div className="relative flex flex-col items-center justify-center w-[180px] shrink-0 border-[4px] border-black bg-white px-2 py-2 min-h-[120px] self-start mt-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <span className="text-black font-bold text-[18px] leading-tight text-center break-words w-full uppercase">
                          {product.promoContent}
                      </span>
                  </div>
               ) : discount > 0 || ribbonSub !== '0%' ? (
                  <div className="relative flex flex-col items-center justify-center w-[130px] h-[155px] shrink-0 mt-1">
                      <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                          <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                      </svg>
                      <span className="relative z-10 text-white font-bold text-[24px] leading-none uppercase mt-[-15px]">Giảm</span>
                      <span className="relative z-10 text-white font-black leading-none mt-1 text-[52px] tracking-tighter">{ribbonSub}</span>
                  </div>
               ) : (
                  <div className="w-[130px] shrink-0"></div>
               )}
               <div className="flex flex-col items-end justify-start flex-1 ml-6 overflow-hidden mt-1">
                  <div className="flex items-baseline text-black justify-end w-full">
                      <span className={`font-black tracking-tighter leading-none shrink-0 ${priceMain.length > 7 ? 'text-[90px]' : priceMain.length > 5 ? 'text-[110px]' : 'text-[130px]'}`} style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>{priceMain}</span>
                      <span className={`font-bold ml-2 shrink-0 ${priceMain.length > 5 ? 'text-[40px]' : 'text-[50px]'}`}>{priceSub}</span>
                  </div>
                  <div className="text-right text-black text-[42px] shrink-0 leading-tight mt-2">
                     {product.originalPrice ? (
                         <span>Giá niêm yết: <span className="line-through">{formatCurrency(product.originalPrice)}đ</span></span>
                     ) : (
                         <span>&nbsp;</span>
                     )}
                  </div>
               </div>
           </div>
           <div className="w-full mt-4 flex justify-start flex-1 min-h-0 overflow-hidden">
               {product.type ? (
                  <div className="font-bold text-[32px] text-black w-full text-left leading-tight break-words line-clamp-2" style={{ overflowWrap: 'anywhere' }}>
                      *{product.type}
                  </div>
               ) : (
                  <div className="h-[40px]"></div>
               )}
           </div>
        </div>
        
        <div className="mx-6 mt-auto mb-4 flex items-end">
            <div className="w-[320px] shrink-0">
                <BarcodeImage barcode={product.barcode} className="h-[120px] ml-[-10px]" scale={5} bcHeight={16} textsize={15} />
            </div>
            <div className="flex-1 flex justify-between items-end border-t-[4px] border-black pb-2 pt-2 ml-4 text-[24px] font-bold text-black">
               <div className="text-center flex-1 px-4 whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                  {product.dateRange ? `Áp dụng ${product.dateRange}` : 'Áp dụng 01/07 - 31/07'}
               </div>
               {product.unit ? (
                  <div className="text-right min-w-[70px] mb-1">
                     {product.unit.startsWith('/') ? product.unit : `/${product.unit}`}
                  </div>
               ) : null}
            </div>
        </div>
      </div>
    );
  };

  const TemplateSale50x80 = ({ product }) => {
    const numPrice = parseFloat(String(product.price || 0).replace(/[^\d]/g, '')) || 0;
    const numOriginalPrice = parseFloat(String(product.originalPrice || 0).replace(/[^\d]/g, '')) || 0;
    
    // Phần nghìn (in to khổng lồ) và phần lẻ
    let mainThousands = '0';
    let remainderDisplay = '000';
    if (numPrice >= 1000) {
      mainThousands = Math.floor(numPrice / 1000);
      const rem = numPrice % 1000;
      remainderDisplay = rem > 0 ? String(rem).padStart(3, '0') : '000';
    } else if (numPrice > 0) {
      mainThousands = numPrice;
      remainderDisplay = '000';
    }

    // Giá cũ gạch ngang (lấy phần nghìn nếu tròn 3 số 0, hoặc format đầy đủ nếu lẻ)
    let oldPriceDisplay = '';
    if (numOriginalPrice > 0) {
      if (numOriginalPrice % 1000 === 0) {
        oldPriceDisplay = Math.floor(numOriginalPrice / 1000);
      } else {
        oldPriceDisplay = numOriginalPrice.toLocaleString('en-US');
      }
    }

    // Số tiền tiết kiệm (ưu tiên discountAmount từ database: discount_amount)
    let savingDisplay = '';
    if (product.discountAmount) {
      const numSaving = parseFloat(String(product.discountAmount).replace(/[^\d]/g, '')) || 0;
      if (numSaving > 0) savingDisplay = numSaving.toLocaleString('en-US');
    }
    if (!savingDisplay && numOriginalPrice > numPrice) {
      savingDisplay = (numOriginalPrice - numPrice).toLocaleString('en-US');
    }

    return (
      <div className="w-full h-full bg-white flex flex-col p-2.5 box-border relative font-sans text-black select-none">
        <div className="w-full h-full border-[2.5px] border-black rounded-[8px] flex flex-col p-2.5 relative overflow-hidden bg-white">
            {/* Tên sản phẩm */}
            <div className="text-center font-bold text-[28px] leading-snug line-clamp-2 px-1 pb-2 pt-0.5 text-black font-sans">
              {product.name}
            </div>

            {/* Vạch ngang ngăn cách */}
            <div className="w-full border-b-[2px] border-black mb-2 shrink-0"></div>

            {/* Mã sản phẩm */}
            <div className="flex items-center gap-3 px-2 font-sans text-black shrink-0">
               <span className="font-bold text-[24px]">Mã SP</span>
               <span className="font-bold text-[26px] tracking-wider">{product.barcode}</span>
            </div>

            {/* Khu vực giá khuyến mãi to khổng lồ */}
            <div className="flex-1 flex flex-col justify-center items-center w-full px-2 my-auto font-sans">
               <div className="text-black font-black text-[175px] leading-none tracking-tighter text-center">
                 {mainThousands}
               </div>

               <div className="flex justify-between items-baseline w-full px-4 mt-2">
                 <div className="font-bold text-[38px] text-gray-800 line-through">
                   {oldPriceDisplay}
                 </div>
                 <div className="font-black text-[42px] text-black tracking-tight">
                   {remainderDisplay} <span className="text-[28px] font-bold align-baseline">đ</span>
                 </div>
               </div>
            </div>

            {/* Ô tiết kiệm (discount_amount) */}
            {savingDisplay ? (
              <div className="w-[92%] mx-auto border-[2px] border-black rounded-[4px] py-1.5 px-3 flex items-center justify-center gap-2 mb-2 shrink-0 font-sans">
                <span className="text-[24px] font-bold text-black">Tiết kiệm:</span>
                <span className="text-[28px] font-black text-black">{savingDisplay}</span>
                <span className="text-[22px] font-bold text-black">đ</span>
              </div>
            ) : (
              <div className="h-2"></div>
            )}

            {/* Thời gian áp dụng */}
            <div className="text-center font-sans text-black mb-1 shrink-0">
               <div className="text-[19px] text-gray-700 font-medium leading-tight">Thời gian áp dụng:</div>
               <div className="text-[22px] font-bold leading-tight mt-0.5">
                 {product.dateRange ? product.dateRange.replace(/\s*-\s*/g, ' - ') : 'Áp dụng: Liên hệ'}
               </div>
            </div>
        </div>
      </div>
    );
  };

  const getPromoContentInfo = (rawContent, size) => {
    // Tự động thêm khoảng trắng sau dấu phẩy/chấm phẩy nếu viết liền (VD: "102332,102336" -> "102332, 102336")
    const formatted = (rawContent || '').replace(/([,;])([^\s])/g, '$1 $2').trim();
    const len = formatted.length;
    
    let fontSize = 68;
    let lineHeight = 1.38;

    if (size === 'A6') {
      // Khổ A6 dọc (1000px x 1414px), vùng nội dung rộng ~850px, cao ~950px
      if (len <= 30) {
        fontSize = 92;
        lineHeight = 1.35;
      } else if (len <= 55) {
        fontSize = 82;
        lineHeight = 1.38;
      } else if (len <= 85) {
        fontSize = 72;
        lineHeight = 1.4;
      } else if (len <= 125) {
        fontSize = 62;
        lineHeight = 1.38;
      } else if (len <= 170) {
        fontSize = 50;
        lineHeight = 1.35;
      } else {
        fontSize = 42;
        lineHeight = 1.32;
      }
    } else {
      // Khổ A5 & A7 ngang (1000px x 707px), vùng nội dung rộng ~850px, cao ~420px
      if (len <= 30) {
        fontSize = 62;
        lineHeight = 1.28;
      } else if (len <= 55) {
        fontSize = 52;
        lineHeight = 1.3;
      } else if (len <= 85) {
        fontSize = 42;
        lineHeight = 1.32;
      } else if (len <= 125) {
        fontSize = 35;
        lineHeight = 1.32;
      } else if (len <= 170) {
        fontSize = 28;
        lineHeight = 1.3;
      } else {
        fontSize = 23;
        lineHeight = 1.28;
      }
    }

    return {
      text: formatted,
      style: {
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'pre-line'
      }
    };
  };

  const TemplateSpecialPromo = ({ product }) => {
    const isA6 = promoSize === 'A6';
    const promoInfo = getPromoContentInfo(product.promoContent, promoSize);

    return (
      <div className="w-full h-full bg-white flex flex-col p-4 box-border relative">
        <div className={`w-full h-full ${isA6 ? 'border-[8px] rounded-[40px] p-8' : 'border-[6px] rounded-[28px] p-6'} border-black flex flex-col relative overflow-hidden`}>
            {/* Top Name */}
            <div 
              className={`text-center text-black font-extrabold leading-tight line-clamp-2 px-6 ${isA6 ? 'mb-8 mt-3' : 'mb-3 mt-1'}`}
              style={{ 
                fontSize: isA6 ? '54px' : '36px',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {product.name}
            </div>
            
            {/* Divider */}
            <div className={`w-full ${isA6 ? 'h-[6px] mb-8' : 'h-[4px] mb-3'} bg-black rounded-full shrink-0`}></div>
            
            {/* Promo Content Body */}
            <div className={`flex-1 flex flex-col items-center justify-center text-center w-full overflow-hidden ${isA6 ? 'px-8 py-4' : 'px-6 py-2'}`}>
              <div 
                className="text-black font-black text-center w-full max-w-full tracking-wide"
                style={promoInfo.style}
              >
                {promoInfo.text}
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className={`flex justify-between items-end w-full px-2 mt-auto shrink-0 whitespace-nowrap overflow-hidden ${isA6 ? 'pb-3' : 'pb-1'}`}>
               <div 
                 className="font-bold text-black"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  {product.barcode}
               </div>
               <div 
                 className="font-bold text-black mx-2"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  |
               </div>
               <div 
                 className="font-bold text-black"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  {product.dateRange ? product.dateRange.replace(/\s*-\s*/g, ' - ') : 'Áp dụng: Liên hệ'}
               </div>
            </div>
        </div>
      </div>
    );
  };

  let TemplateComponent = TemplateNormal;
  if (!isSpecialPromo) {
      if (selectedTemplate === 'normal_usp') TemplateComponent = TemplateNormalUSP;
      else if (selectedTemplate === 'normal_small') TemplateComponent = TemplateNormalSmall;
      else if (selectedTemplate === 'sale') TemplateComponent = TemplateSale;
      else if (selectedTemplate === 'sale_usp') TemplateComponent = TemplateSaleUSP;
      else if (selectedTemplate === 'sale_50x80') TemplateComponent = TemplateSale50x80;
  } else {
      TemplateComponent = TemplateSpecialPromo;
  }

  const pages = getPaginatedTags();
  const totalTags = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-gray-100 overflow-hidden font-sans">
        
        {/* Sidebar Controls */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[380px] bg-white border-r border-gray-200 z-20 shrink-0 h-full print:hidden`}>
            
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center shrink-0 bg-gray-50">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E0376F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    <h1 className="text-lg font-bold text-[#10285B]">Xưởng in tem</h1>
                </div>
                <button className="md:hidden p-1 text-gray-500" onClick={() => setIsSidebarOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#10285B] mb-1">Loại tem (Chương trình):</label>
                    <select 
                      value={promoType} 
                      onChange={e => setPromoType(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#E0376F] outline-none"
                    >
                      <option value="Niêm yết">Niêm yết</option>
                      <option value="Discount">Discount</option>
                      <option value="Mua hàng tặng hàng">Mua hàng tặng hàng</option>
                      <option value="Mua càng nhiều càng rẻ">Mua nhiều rẻ</option>
                      <option value="Combo">Combo</option>
                      <option value="Hóa đơn">Hóa đơn</option>
                    </select>
                  </div>
                  
                  {promoType === 'Niêm yết' && (
                    <div className="relative" ref={searchRef}>
                      <label className="block text-xs font-bold text-[#10285B] mb-1">Tìm kiếm sản phẩm:</label>
                      <div className="flex bg-gray-100 rounded border border-gray-200 focus-within:border-[#E0376F] transition-colors">
                          <input 
                              type="text" 
                              placeholder="Nhập tên hoặc mã vạch..." 
                              className="flex-1 bg-transparent p-2 text-sm outline-none"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                          />
                          <button className="p-2 text-gray-500 hover:text-[#E0376F]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          </button>
                      </div>
                      
                      {/* Search Suggestions Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md max-h-60 overflow-y-auto z-50">
                              {suggestions.map(s => (
                                  <div 
                                      key={s.barcode} 
                                      className="p-3 border-b border-gray-100 hover:bg-pink-50 cursor-pointer"
                                      onClick={() => addToQueue(s)}
                                  >
                                      <div className="text-sm font-bold text-[#10285B]">{s.name}</div>
                                      <div className="flex justify-between mt-1">
                                          <div className="text-xs text-gray-500">{s.barcode}</div>
                                          <div className="text-xs font-bold text-[#E0376F]">{formatCurrency(s.price)}đ</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={handleExportExcel}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          Tải xuống
                        </button>
                        
                        <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          Tải lên (Import)
                          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}

                  {promoType !== 'Niêm yết' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#10285B] mb-1">Tháng:</label>
                        <select 
                          value={promoMonth} 
                          onChange={e => setPromoMonth(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#E0376F] outline-none"
                        >
                          {months.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-bold text-[#10285B] mb-1">Cửa hàng:</label>
                        <select 
                          value={selectedStore} 
                          onChange={e => setSelectedStore(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#E0376F] outline-none"
                        >
                          <option value="">-- Chọn cửa hàng --</option>
                          {stores.map(s => (
                            <option key={s.store_name} value={s.store_name}>{s.store_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handleExportExcel}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          Tải xuống
                        </button>
                        
                        <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition-colors flex items-center justify-center gap-1 cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          Tải lên (Import)
                          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </>
                  )}
                </div>

              {/* Template Selection */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
                  <div className="mb-2">
                     <h3 className="text-xs font-bold text-[#10285B] uppercase">Cấu hình mẫu in</h3>
                  </div>
                  
                  {!isSpecialPromo ? (
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'normal', label: 'Niêm yết (60x35)', type: 'Niêm yết' },
                            { id: 'normal_usp', label: 'Niêm yết USP (80x70)', type: 'Niêm yết' },
                            { id: 'normal_small', label: 'Niêm yết Nhỏ (50x24)', type: 'Niêm yết' },
                            { id: 'sale', label: 'Sale Thường (60x35)', type: 'Discount' },
                            { id: 'sale_usp', label: 'Sale USP (80x70)', type: 'Discount' },
                            { id: 'sale_50x80', label: 'Sale Đứng (50x80)', type: 'Discount' }
                        ].filter(tpl => tpl.type === promoType).map(tpl => (
                            <button
                                key={tpl.id}
                                onClick={() => setSelectedTemplate(tpl.id)}
                                className={`py-1.5 rounded-md border text-xs font-medium transition-all ${
                                    selectedTemplate === tpl.id 
                                    ? 'border-[#E0376F] bg-pink-50 text-[#E0376F]' 
                                    : 'border-gray-200 text-gray-600 hover:bg-white'
                                }`}
                            >
                                {tpl.label}
                            </button>
                        ))}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Chọn kích thước tem:</label>
                      <select 
                        value={promoSize} 
                        onChange={e => setPromoSize(e.target.value)}
                        className="w-full border border-[#E0376F] rounded p-2 text-sm bg-pink-50 font-bold text-[#E0376F] outline-none"
                      >
                        <option value="A5">Khổ A5 (210 x 148 mm)</option>
                        <option value="A6">Khổ A6 (148 x 105 mm)</option>
                        <option value="A7">Khổ A7 (105 x 74 mm)</option>
                      </select>
                    </div>
                  )}
              </div>

              {/* List Chờ in */}
              <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                      <h3 className="text-[11px] font-bold text-[#10285B] uppercase">Danh sách chờ in</h3>
                      <span className="bg-[#E0376F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tổng: {totalTags}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50 scrollbar-thin">
                      {products.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs mt-6">Chưa có sản phẩm nào chờ in.</div>
                      ) : (
                          products.map(product => (
                              <div key={product.id} className="bg-white border border-gray-200 rounded-md p-2 flex flex-col gap-2 relative group shadow-sm">
                                  <div className="absolute top-1.5 right-1.5 flex gap-1 bg-white pl-2">
                                      <button onClick={() => removeProduct(product.id)} className="text-gray-300 hover:text-red-500 p-0.5 rounded"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                  </div>
                                  <div className="pr-8">
                                      <div className="text-[11px] font-bold text-[#10285B] line-clamp-1">{product.name}</div>
                                      <div className="text-[9px] text-gray-500 mt-0.5">{product.barcode} {product.promoContent ? `| ${product.promoContent}` : ''}</div>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-gray-100 pt-1.5">
                                      <div className="text-black font-bold text-[11px]">{formatCurrency(product.price)}đ</div>
                                      <div className="flex items-center border border-gray-200 rounded">
                                          <button onClick={() => updateQuantity(product.id, -1)} className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 text-[10px]">-</button>
                                          <input type="number" value={product.quantity} onChange={(e) => setExactQuantity(product.id, e.target.value)} className="w-7 text-center text-[11px] border-x border-gray-200 outline-none no-spinners" min="1"/>
                                          <button onClick={() => updateQuantity(product.id, 1)} className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 text-[10px]">+</button>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
            </div>
        </div>

        {/* Viewport / Bản xem trước & Topbar */}
        <div className="print-viewport flex-1 flex flex-col min-w-0 bg-gray-100 relative">
            
            {/* Topbar */}
            <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between print:hidden shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button className="md:hidden p-2 text-[#10285B] bg-slate-100 rounded-md" onClick={() => setIsSidebarOpen(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <h2 className="text-sm font-bold text-[#10285B]">Bản xem trước <span className="text-[#E0376F]">({totalTags} tem)</span></h2>
                    
                    {/* Tiến độ tải mã vạch */}
                    {!isSpecialPromo && totalBarcodesCount > 0 && (
                      !isAllBarcodesLoaded ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
                          <svg className="w-3.5 h-3.5 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Đang nạp barcode: {loadedBarcodesCount}/{totalBarcodesCount} loại ({Math.round(loadedBarcodesCount / totalBarcodesCount * 100)}%)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                          <span>Mã vạch đã sẵn sàng 100%</span>
                        </div>
                      )
                    )}
                </div>
                
                <div className="flex gap-4 text-xs font-medium items-center">
                    <div className="flex items-center gap-1">
                        <label className="text-gray-500 hidden sm:block">Khổ giấy:</label>
                        <span className="text-[#10285B] font-bold">A4 (Dọc)</span>
                    </div>
                    
                    <button onClick={() => setProducts([])} className="text-gray-500 hover:text-[#E0376F] flex items-center gap-1 border-r border-gray-200 pr-4">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Xóa <span className="hidden sm:inline">tất cả</span>
                    </button>

                    <button 
                        onClick={() => {
                            if (!isAllBarcodesLoaded) {
                                if (!confirm(`Hệ thống đang tải mã vạch (${loadedBarcodesCount}/${totalBarcodesCount} loại đã xong). Bạn có chắc chắn muốn in ngay bây giờ không? (Một số tem chưa xong có thể chưa hiện mã vạch)`)) {
                                    return;
                                }
                            }
                            window.print();
                        }}
                        disabled={products.length === 0}
                        className={`font-bold py-1.5 px-4 rounded shadow-sm flex items-center gap-2 transition-all ${
                            products.length === 0 
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                : !isAllBarcodesLoaded 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
                                    : 'bg-[#E0376F] hover:bg-pink-700 text-white'
                        }`}
                    >
                        {!isAllBarcodesLoaded && products.length > 0 ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        )}
                        {!isAllBarcodesLoaded && products.length > 0 ? `ĐANG NẠP MÃ (${loadedBarcodesCount}/${totalBarcodesCount})` : 'IN TEM'}
                    </button>
                </div>
            </div>

            {/* Pages View */}
            <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center gap-8 bg-gray-100 print:bg-white print:p-0 print:block print:overflow-visible custom-scrollbar">
                {pages.length === 0 ? (
                    <div className="bg-white shadow-md print:shadow-none shrink-0 flex flex-col items-center justify-center text-gray-400" style={{ width: `${currentPaper.w}px`, height: `${currentPaper.h}px` }}>
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <p className="text-lg">Trang in trống</p>
                        <p className="text-sm mt-1">Hãy tìm kiếm hoặc thêm sản phẩm từ menu bên trái</p>
                    </div>
                ) : (
                    pages.map((page, pageIndex) => (
                        <div 
                            key={`page-${pageIndex}`}
                            className="page-container bg-white shadow-md print:shadow-none shrink-0 relative box-border overflow-hidden mx-auto"
                            style={{
                                width: `${currentPaper.w}px`,
                                height: `${currentPaper.h}px`,
                                padding: `${pagePadding.y}px ${pagePadding.x}px`
                            }}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${tagsPerRow}, ${scaledTagWidth}px)`,
                                gap: `${tagGap}px`,
                                justifyContent: 'center',
                                alignContent: 'start'
                            }}>
                                 {page.map(tag => {
                                     const isTagReady = isSpecialPromo || !tag.barcode || loadedBarcodes.has(tag.barcode);
                                     return (
                                         <div 
                                             key={tag.renderId} 
                                             className="tag-wrapper relative break-inside-avoid origin-top-left overflow-hidden" 
                                             style={{ 
                                                 width: `${scaledTagWidth}px`, 
                                                 height: `${scaledTagHeight}px`,
                                                 breakInside: 'avoid', 
                                                 pageBreakInside: 'avoid' 
                                             }}
                                         >
                                             <div style={{
                                                 transform: `scale(${scaleFactor})`,
                                                 transformOrigin: 'top left',
                                                 width: `${baseTag.w}px`,
                                                 height: `${baseTag.h}px`
                                             }}>
                                                 {isTagReady ? (
                                                     <TemplateComponent product={tag} />
                                                 ) : (
                                                     <div className="w-full h-full bg-white border border-dashed border-gray-300 rounded-[20px] flex flex-col items-center justify-center p-6 text-center select-none print:hidden">
                                                         <div className="w-12 h-12 border-4 border-[#E0376F] border-t-transparent rounded-full animate-spin mb-4"></div>
                                                         <div className="font-bold text-[32px] text-[#10285B] line-clamp-1 px-4">{tag.name}</div>
                                                         <div className="text-[24px] text-gray-500 font-mono mt-2 bg-gray-50 px-4 py-1 rounded">Đang tạo barcode: {tag.barcode}</div>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 })}
                            </div>
                            
                            <div className="absolute bottom-4 right-6 text-[12px] font-bold text-gray-400 print:hidden">
                                Trang {pageIndex + 1} / {pages.length}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Global Styles for Printing and Scrollbar */}
        <style dangerouslySetInnerHTML={{__html: `
          @page { 
            margin: 0; 
            size: ${currentPaper.css}; 
          }
          @media print {
            body * { visibility: hidden; }
            .print\\:hidden { display: none !important; }
            .print-viewport, .print-viewport * { visibility: visible; }
            .print-viewport { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; background-color: white !important; }
            .page-container { 
                page-break-after: always; 
                margin: 0 !important; 
                box-shadow: none !important; 
                border: none !important; 
                width: 100% !important;
                height: auto !important;
            }
            .page-container:last-child { page-break-after: auto; }
            .tag-wrapper { page-break-inside: avoid; break-inside: avoid; display: inline-block; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
          
          /* Hide spinners on number inputs */
          .no-spinners::-webkit-inner-spin-button, 
          .no-spinners::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
        `}} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
