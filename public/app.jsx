const { useState, useEffect, useRef } = React;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('normal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Manual Input state
  const [inputMode, setInputMode] = useState('search');
  const [manualForm, setManualForm] = useState({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', location: '', supplier: '', type: '', unit: '', dateRange: '' });
  const [editingId, setEditingId] = useState(null);

  // Print Configuration
  const [paperSize, setPaperSize] = useState('A4_portrait');


  // Fetch data from API based on search query
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
    
    // Debounce to avoid spamming the API
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
    // Remove trailing .00 or convert to number first
    const num = Number(amount);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getDiscountPercent = (price, original) => {
    if (!original || price >= original) return 0;
    return Math.round(((original - price) / original) * 100);
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
      setManualForm({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', location: '', supplier: '', type: '', unit: '', dateRange: '' });
  };

  const handleDownloadTemplate = () => {
    if (!window.XLSX) return alert("Thư viện Excel đang được tải, vui lòng thử lại sau 1 giây.");
    const ws = window.XLSX.utils.aoa_to_sheet([
      ["Tên sản phẩm", "Giá bán", "Mã vạch", "Giá gốc", "% Giảm", "Đơn vị", "Đặc điểm (USP)", "Hạn áp dụng"],
      ["Sữa tắm Kose", 259000, "4971710311556", 300000, 10, "/Chai", "Dưỡng ẩm da", "01/07 - 31/07"]
    ]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Template");
    window.XLSX.writeFile(wb, "mau_import_tem.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.XLSX) return alert("Thư viện Excel đang được tải, vui lòng thử lại sau 1 giây.");
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = window.XLSX.utils.sheet_to_json(ws);
      
      const importedProducts = data.map((row, idx) => ({
        id: `imported-${Date.now()}-${idx}`,
        name: row["Tên sản phẩm"] || '',
        price: row["Giá bán"] || '',
        barcode: row["Mã vạch"] || '',
        originalPrice: row["Giá gốc"] || '',
        discountPercent: row["% Giảm"] || '',
        unit: row["Đơn vị"] || '',
        type: row["Đặc điểm (USP)"] || '',
        dateRange: row["Hạn áp dụng"] || '',
        quantity: 1
      })).filter(p => p.name && p.price && p.barcode);

      if (importedProducts.length > 0) {
        setProducts(prev => {
            const merged = [...prev];
            importedProducts.forEach(ip => {
                const existing = merged.find(m => m.barcode === ip.barcode);
                if (existing) { existing.quantity += 1; } 
                else { merged.push(ip); }
            });
            return merged;
        });
        alert(`Đã import thành công ${importedProducts.length} sản phẩm!`);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng sử dụng đúng file mẫu tải về.");
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
          location: product.location || '', supplier: product.supplier || '', type: product.type || '', 
          unit: product.unit || '', dateRange: product.dateRange || '' 
      });
      setEditingId(product.id);
  };

  const cancelEdit = () => {
      setEditingId(null);
      setManualForm({ name: '', price: '', barcode: '', originalPrice: '', discountPercent: '', location: '', supplier: '', type: '', unit: '', dateRange: '' });
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
  const pagePadding = { x: 20, y: 30 }; 
  const tagGap = 14; 
  
  // Base tag sizes based on user requested mm dimensions scaled up for clarity
  let baseTag = { w: 600, h: 350 }; // Normal / Sale (60x35mm)
  let targetWidthMm = 60; // 60mm width

  if (selectedTemplate === 'normal_usp' || selectedTemplate === 'sale_usp') {
      baseTag = { w: 800, h: 700 }; // Normal USP / Sale USP (80x70mm)
      targetWidthMm = 80; // 80mm width
  }

  // Calculate physical pixels required for exact printing (96 DPI)
  const pxPerMm = 96 / 25.4;
  const scaledTagWidth = targetWidthMm * pxPerMm;
  const scaleFactor = scaledTagWidth / baseTag.w;
  const scaledTagHeight = baseTag.h * scaleFactor;

  // Compute how many tags can fit per row
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

  const BarcodeImage = ({ barcode, className = "h-24", scale = 4, bcHeight = 16 }) => (
      <img 
          src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&includetext=true&scale=${scale}&height=${bcHeight}`} 
          alt="barcode" 
          className={`${className} w-auto object-contain mix-blend-multiply`}
          crossOrigin="anonymous"
      />
  );

  const getTitleSize = (name, baseSize) => {
      const len = name ? name.length : 0;
      if (baseSize === 38) {
          if (len > 75) return 'text-[24px] line-clamp-3';
          if (len > 45) return 'text-[30px] line-clamp-3';
          return 'text-[38px] line-clamp-2';
      }
      if (baseSize === 60) {
          if (len > 75) return 'text-[38px] line-clamp-3';
          if (len > 45) return 'text-[48px] line-clamp-3';
          return 'text-[60px] line-clamp-2';
      }
      return `text-[${baseSize}px] line-clamp-2`;
  };

  // 1. Tem Niêm yết Thường (350x600) - KHÔNG USP
  const TemplateNormal = ({ product }) => (
    <div className="w-[600px] h-[350px] bg-white rounded-3xl border-2 border-gray-300 px-6 py-5 flex flex-col justify-between overflow-hidden shadow-sm box-border relative">
      <div className="text-center w-full">
        <h3 className={`text-[#10285B] font-bold leading-tight break-words ${getTitleSize(product.name, 38)}`} style={{ overflowWrap: 'anywhere' }}>{product.name}</h3>
      </div>
      <div className="text-center w-full mt-1">
         <span className="text-[#E0376F] font-bold text-[85px] tracking-tight">{formatCurrency(product.price)} <span className="text-[60px] underline">đ</span></span>
      </div>
      <div className="flex justify-end items-end mt-auto w-full">
          {/* Căn mã vạch sang bên phải do không có USP */}
          <BarcodeImage barcode={product.barcode} className="h-[75px]" scale={3} bcHeight={16} />
      </div>
    </div>
  );

  // 2. Tem Niêm yết có USP (700x800)
  const TemplateNormalUSP = ({ product }) => (
    <div className="w-[800px] h-[700px] bg-white rounded-[40px] border-2 border-gray-300 p-10 flex flex-col justify-between overflow-hidden shadow-sm box-border relative">
      <div className="text-center w-full pt-4">
        <h3 className={`text-[#10285B] font-bold leading-tight break-words ${getTitleSize(product.name, 60)}`} style={{ overflowWrap: 'anywhere' }}>{product.name}</h3>
      </div>
      <div className="text-center w-full mt-4">
         <span className="text-[#E0376F] font-bold text-[140px] tracking-tight">{formatCurrency(product.price)} <span className="text-[90px] underline">đ</span></span>
      </div>
      <div className="flex justify-between items-end mt-auto w-full pt-4 gap-6">
          {product.type ? (
              <div className="font-bold text-[36px] text-black flex-1 min-w-0 max-h-[140px] overflow-hidden flex items-end leading-tight pb-2 break-words" style={{ overflowWrap: 'anywhere' }}>
                  <span className="line-clamp-3 w-full">*{product.type}</span>
              </div>
          ) : (
              <div className="flex-1"></div>
          )}
          <div className="flex flex-col items-end shrink-0">
              <BarcodeImage barcode={product.barcode} className="h-[135px]" scale={4} bcHeight={20} />
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

    return (
      <div className="w-[600px] h-[350px] bg-white border-[4px] border-black flex flex-col overflow-hidden box-border relative">
        <div className="bg-black text-white text-center font-black text-[55px] uppercase tracking-widest py-1 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        <div className="px-6 pt-1 pb-0 text-center font-bold text-[26px] text-black line-clamp-2 break-words shrink-0 leading-tight" style={{ overflowWrap: 'anywhere' }}>
          {product.name}
        </div>
        
        <div className="flex-1 min-h-0 px-6 flex items-start justify-between relative mt-1">
           {/* Ribbon giảm giá */}
           {discount > 0 ? (
              <div className="relative flex flex-col items-center justify-center w-[90px] h-[110px] shrink-0 mt-1">
                  <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                      <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                  </svg>
                  <span className="relative z-10 text-white font-bold text-[18px] leading-none uppercase mt-[-10px]">Giảm</span>
                  <span className="relative z-10 text-white font-black text-[32px] leading-none mt-1">{discount}%</span>
              </div>
           ) : (
              <div className="w-[90px] shrink-0"></div>
           )}
           
           <div className="flex flex-col items-end justify-start flex-1 ml-4 overflow-hidden relative top-[0px]">
              <div className="flex items-baseline text-black justify-end w-full mt-1">
                  <span className={`font-black tracking-tighter leading-none shrink-0 ${priceMain.length > 7 ? 'text-[65px]' : priceMain.length > 5 ? 'text-[80px]' : 'text-[95px]'}`} style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>{priceMain}</span>
                  <span className={`font-bold ml-1 shrink-0 ${priceMain.length > 5 ? 'text-[32px]' : 'text-[40px]'}`}>{priceSub}</span>
              </div>
              <div className="text-right text-black text-[22px] shrink-0 leading-tight mt-1">
                 {product.originalPrice ? (
                     <span>Giá gốc: <span className="line-through">{formatCurrency(product.originalPrice)}đ</span></span>
                 ) : (
                     <span>&nbsp;</span>
                 )}
              </div>
           </div>
        </div>
        
        <div className="mx-4 mt-auto mb-2 flex items-end">
            <div className="w-[140px] shrink-0">
                <BarcodeImage barcode={product.barcode} className="h-[60px] ml-[-10px]" scale={2} bcHeight={12} />
            </div>
            <div className="flex-1 flex justify-between items-end border-t-[3px] border-black pb-1 pt-1 ml-2 text-[18px] font-bold text-black">
               <div className="text-center flex-1 px-2 whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                  {product.dateRange ? `Áp dụng ${product.dateRange}` : 'Áp dụng 01/07 - 31/07'}
               </div>
               <div className="text-right min-w-[50px] mb-1">
                  {product.unit || '/Gói'}
               </div>
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

    return (
      <div className="w-[800px] h-[700px] bg-white border-[5px] border-black flex flex-col overflow-hidden box-border relative">
        <div className="bg-black text-white text-center font-black text-[80px] uppercase tracking-widest py-2 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        <div className="px-8 pt-3 pb-0 text-center font-bold text-[38px] text-black line-clamp-2 break-words shrink-0 leading-tight" style={{ overflowWrap: 'anywhere' }}>
          {product.name}
        </div>
        
        <div className="flex-1 min-h-0 px-8 flex flex-col items-center justify-start relative mt-1">
           <div className="flex w-full justify-between items-start">
               {discount > 0 ? (
                  <div className="relative flex flex-col items-center justify-center w-[130px] h-[155px] shrink-0 mt-1">
                      <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                          <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                      </svg>
                      <span className="relative z-10 text-white font-bold text-[24px] leading-none uppercase mt-[-15px]">Giảm</span>
                      <span className="relative z-10 text-white font-black text-[48px] leading-none mt-1">{discount}%</span>
                  </div>
               ) : (
                  <div className="w-[130px] shrink-0"></div>
               )}
               
               <div className="flex flex-col items-end justify-start flex-1 ml-6 overflow-hidden mt-1">
                  <div className="flex items-baseline text-black justify-end w-full">
                      <span className={`font-black tracking-tighter leading-none shrink-0 ${priceMain.length > 7 ? 'text-[90px]' : priceMain.length > 5 ? 'text-[110px]' : 'text-[130px]'}`} style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>{priceMain}</span>
                      <span className={`font-bold ml-2 shrink-0 ${priceMain.length > 5 ? 'text-[40px]' : 'text-[50px]'}`}>{priceSub}</span>
                  </div>
                  <div className="text-right text-black text-[30px] shrink-0 leading-tight mt-2">
                     {product.originalPrice ? (
                         <span>Giá gốc: <span className="line-through">{formatCurrency(product.originalPrice)}đ</span></span>
                     ) : (
                         <span>&nbsp;</span>
                     )}
                  </div>
               </div>
           </div>
           
           {/* Khu vực chứa USP */}
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
            <div className="w-[200px] shrink-0">
                <BarcodeImage barcode={product.barcode} className="h-[80px] ml-[-10px]" scale={3} bcHeight={14} />
            </div>
            <div className="flex-1 flex justify-between items-end border-t-[4px] border-black pb-2 pt-2 ml-4 text-[24px] font-bold text-black">
               <div className="text-center flex-1 px-4 whitespace-nowrap overflow-hidden text-ellipsis mb-1">
                  {product.dateRange ? `Áp dụng ${product.dateRange}` : 'Áp dụng 01/07 - 31/07'}
               </div>
               <div className="text-right min-w-[70px] mb-1">
                  {product.unit || '/Gói'}
               </div>
            </div>
        </div>
      </div>
    );
  };

  const TemplateComponentMap = {
    'normal': TemplateNormal,
    'normal_usp': TemplateNormalUSP,
    'sale': TemplateSale,
    'sale_usp': TemplateSaleUSP
  };

  const TemplateComponent = TemplateComponentMap[selectedTemplate] || TemplateNormal;

  const pages = getPaginatedTags();
  const totalTags = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-gray-100 overflow-hidden font-sans">
        
        {/* Sidebar Controls */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[340px] bg-white border-r border-gray-200 z-20 shrink-0 h-full print:hidden`}>
            
            {/* Header */}
            <div className="p-3 border-b border-gray-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E0376F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    <h1 className="text-lg font-bold text-[#10285B]">Xưởng in tem</h1>
                </div>
                <button className="md:hidden p-1 text-gray-500" onClick={() => setIsSidebarOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            {/* Template Selection */}
            <div className="px-4 py-2 border-b border-gray-100 shrink-0">
                <div className="flex justify-between items-center mb-1.5">
                   <h3 className="text-[11px] font-bold text-[#10285B] uppercase">1. Kho mẫu in</h3>
                   <span className="text-[10px] text-gray-400">4 mẫu</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'normal', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z', label: 'Niêm yết' },
                        { id: 'normal_usp', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', label: 'Niêm yết (USP)' },
                        { id: 'sale', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', label: 'Sale Thường' },
                        { id: 'sale_usp', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Sale (USP)' }
                    ].map(tpl => (
                        <button
                            key={tpl.id}
                            onClick={() => setSelectedTemplate(tpl.id)}
                            className={`flex flex-col items-center justify-center py-1.5 rounded-md border text-[10px] font-medium transition-all ${
                                selectedTemplate === tpl.id 
                                ? 'border-[#E0376F] bg-pink-50 text-[#E0376F]' 
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tpl.icon}></path></svg>
                            {tpl.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Forms */}
            <div className="px-4 py-2 border-b border-gray-100 shrink-0 bg-gray-50">
                <h3 className="text-[11px] font-bold text-[#10285B] uppercase mb-1.5">2. {editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
                <div className="flex bg-gray-200 p-0.5 rounded-md mb-2">
                    <button 
                        onClick={() => { setInputMode('search'); if(editingId) cancelEdit(); }} 
                        className={`flex-1 text-[11px] py-1 rounded-sm font-medium ${inputMode === 'search' ? 'bg-white shadow-sm text-[#10285B]' : 'text-gray-500'}`}
                    >
                        Từ dữ liệu mẫu
                    </button>
                    <button 
                        onClick={() => setInputMode('manual')} 
                        className={`flex-1 text-[11px] py-1 rounded-sm font-medium ${inputMode === 'manual' ? 'bg-white shadow-sm text-[#10285B]' : 'text-gray-500'}`}
                    >
                        Nhập thủ công
                    </button>
                </div>

                {inputMode === 'search' ? (
                    <div className="relative" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="Gõ tên hoặc mã vạch để tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full text-[12px] p-1.5 pl-7 border border-gray-300 rounded focus:border-[#10285B] outline-none"
                        />
                        <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        
                        {showSuggestions && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[250px] overflow-y-auto">
                                {suggestions.length > 0 ? (
                                    suggestions.map(item => (
                                        <div key={item.barcode + '-' + item.name} onClick={() => addToQueue(item)} className="p-2 border-b border-gray-50 hover:bg-pink-50 cursor-pointer flex justify-between items-center group">
                                            <div>
                                                <div className="text-[12px] font-medium text-[#10285B] line-clamp-1">{item.name}</div>
                                                <div className="text-[10px] text-gray-500">{item.barcode} | {item.category_name}</div>
                                            </div>
                                            <div className="text-[#E0376F] font-bold text-[12px] shrink-0 ml-2">{formatCurrency(item.price)}đ</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-[12px] text-gray-500 text-center">{searchQuery ? 'Không tìm thấy sản phẩm' : 'Gõ để tìm kiếm từ cơ sở dữ liệu'}</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleManualAdd}>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input type="text" placeholder="Tên sản phẩm *" value={manualForm.name} onChange={e => handleFieldChange('name', e.target.value)} className="col-span-2 w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" required />
                            <input type="number" placeholder="Giá bán *" value={manualForm.price} onChange={e => handleFieldChange('price', e.target.value)} className="w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" required />
                            <input type="text" placeholder="Mã vạch *" value={manualForm.barcode} onChange={e => handleFieldChange('barcode', e.target.value)} className="w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" required />
                            <div className="col-span-2 flex gap-2">
                                <input type="number" placeholder="Giá gốc" value={manualForm.originalPrice} onChange={e => handleFieldChange('originalPrice', e.target.value)} className="w-1/2 text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" />
                                <input type="number" placeholder="% Giảm" value={manualForm.discountPercent} onChange={e => handleFieldChange('discountPercent', e.target.value)} className="w-1/2 text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" />
                            </div>
                            <input type="text" placeholder="Đơn vị (vd: /Gói)" value={manualForm.unit} onChange={e => handleFieldChange('unit', e.target.value)} className="col-span-2 w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" />
                        </div>
                        <details className="text-[11px] text-gray-500 group" open={editingId !== null}>
                            <summary className="cursor-pointer font-medium hover:text-[#10285B] mb-2 list-none flex items-center gap-1">
                                <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                Thông tin phụ (USP, Hạn...)
                            </summary>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <input type="text" placeholder="Đặc điểm (USP)" value={manualForm.type} onChange={e => handleFieldChange('type', e.target.value)} className="col-span-2 w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" />
                                <input type="text" placeholder="Hạn áp dụng" value={manualForm.dateRange} onChange={e => handleFieldChange('dateRange', e.target.value)} className="col-span-2 w-full text-[12px] p-1.5 border border-gray-300 rounded focus:border-[#10285B] outline-none" />
                            </div>
                        </details>
                        {editingId ? (
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={cancelEdit} className="w-1/3 py-1 bg-gray-300 text-gray-700 text-[12px] font-bold rounded">Đóng</button>
                                <button type="submit" className="w-2/3 py-1 bg-[#E0376F] text-white text-[12px] font-bold rounded">Hoàn tất sửa</button>
                            </div>
                        ) : (
                            <button type="submit" className="w-full mt-2 py-1.5 bg-[#10285B] text-white text-[12px] font-bold rounded">Thêm</button>
                        )}
                    </form>
                )}
            </div>

            {/* List Chờ in */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <h3 className="text-[11px] font-bold text-[#10285B] uppercase">3. Danh sách chờ in</h3>
                    <span className="bg-[#E0376F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tổng: {totalTags}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50 scrollbar-thin">
                    {products.length === 0 ? (
                        <div className="text-center text-gray-400 text-[11px] mt-6">Chưa có sản phẩm nào.</div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className={`bg-white border ${editingId === product.id ? 'border-[#E0376F] shadow-md' : 'border-gray-200'} rounded-md p-2 flex flex-col gap-2 relative group`}>
                                <div className="absolute top-1.5 right-1.5 flex gap-1 bg-white pl-2">
                                    <button onClick={() => editProduct(product)} className="text-gray-300 hover:text-blue-500 p-0.5 rounded"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                                    <button onClick={() => removeProduct(product.id)} className="text-gray-300 hover:text-red-500 p-0.5 rounded"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                </div>
                                <div className="pr-12">
                                    <div className="text-[11px] font-bold text-[#10285B] line-clamp-1">{product.name}</div>
                                    <div className="text-[9px] text-gray-500 mt-0.5">{product.barcode}</div>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-1.5">
                                    <div className="text-[#E0376F] font-bold text-[11px]">{formatCurrency(product.price)}đ</div>
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
                
                <div className="p-3 border-t border-gray-200 bg-white shrink-0 flex gap-2">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[11px] font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Tải Mẫu Excel
                    </button>
                    <label className="flex-1 bg-[#10285B] text-white py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer hover:bg-blue-900 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Import File
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
                    </label>
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
                        onClick={() => window.print()}
                        disabled={products.length === 0}
                        className="bg-[#E0376F] hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        IN TEM
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
                                {page.map(tag => (
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
                                            <TemplateComponent product={tag} />
                                        </div>
                                    </div>
                                ))}
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
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid #f3f4f6; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
          
          .scrollbar-thin::-webkit-scrollbar { width: 4px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
          
          .no-spinners::-webkit-inner-spin-button, 
          .no-spinners::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          .no-spinners { -moz-appearance: textfield; }
        `}} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
