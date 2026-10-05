
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Lỗi giao diện React:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Đã xảy ra lỗi hiển thị</h2>
            <p className="text-xs text-red-600 mb-4 bg-red-50 p-3 rounded font-mono break-words text-left">
              {this.state.error?.message || 'Lỗi không xác định'}
            </p>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="bg-[#E0376F] hover:bg-pink-700 text-white font-bold py-2 px-5 rounded-lg text-xs transition-all"
              >
                Làm mới trang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
const { useState, useEffect, useRef } = React;

const LoginScreen = ({ onGuestLogin }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-pink-50 p-4 font-sans select-none">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center text-center">
        {/* Logo / Brand */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#10285B] to-[#E0376F] flex items-center justify-center shadow-lg shadow-pink-500/20 mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-black text-[#10285B] mb-2 tracking-tight">XƯỞNG IN TEM SAKUKO</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Hệ thống in tem giá và tem khuyến mại nội bộ Sakuko Store. Vui lòng đăng nhập bằng tài khoản Lark để tiếp tục.
        </p>

        {error && (
          <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 text-left">
            ⚠️ Đăng nhập không thành công: {error}
          </div>
        )}

        {/* Nút đăng nhập Lark */}
        <a
          href="/api/auth/lark/login"
          className="w-full flex items-center justify-center gap-3 bg-[#3370ff] hover:bg-[#2860e1] active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-bold shadow-md shadow-blue-500/25 transition-all text-base mb-4 cursor-pointer"
        >
          <svg className="w-6 h-6 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.14 6.84 9.47.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.02 10.02 0 0022 12c0-5.52-4.48-10-10-10z"/>
          </svg>
          Đăng nhập bằng Lark
        </a>


        <div className="mt-8 pt-6 border-t border-gray-100 w-full flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Xác thực an toàn qua Lark Suite Sakuko
        </div>
      </div>
    </div>
  );
};

const StatsModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tab, setTab] = useState('users'); // 'users' or 'logs'

  // Bộ lọc theo ngày (mặc định 30 ngày qua)
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchStats = (sDate, eDate) => {
    setLoading(true);
    setErrorMsg(null);
    let url = '/api/tracking/stats';
    const params = new URLSearchParams();
    if (sDate) params.append('startDate', sDate);
    if (eDate) params.append('endDate', eDate);
    if (params.toString()) url += '?' + params.toString();

    fetch(url)
      .then(async r => {
        if (!r.ok) {
          const errJson = await r.json().catch(() => ({}));
          throw new Error(errJson.error || `Lỗi tải dữ liệu (${r.status})`);
        }
        return r.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStats(startDate, endDate);
  }, [isOpen, startDate, endDate]);

  // Chọn nhanh ngày
  const setQuickRange = (type) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === '7days') {
      const seven = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      setStartDate(seven);
      setEndDate(today);
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(today);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Đổi quyền Admin / Nhân viên
  const handleToggleRole = async (user) => {
    const isPromoting = user.role !== 'admin';
    const newRole = isPromoting ? 'admin' : 'user';
    const confirmMsg = isPromoting
      ? `Bạn có chắc chắn muốn cấp quyền Quản trị viên (Toàn quyền Admin) cho "${user.name}" không?`
      : `Bạn có chắc chắn muốn chuyển "${user.name}" về quyền Nhân viên thường không?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/tracking/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id, newRole })
      });
      const json = await res.json();
      if (res.ok) {
        fetchStats(startDate, endDate);
      } else {
        alert(json.error || 'Lỗi cập nhật quyền');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Xuất file Excel 2 Sheet
  const handleExportExcel = () => {
    if (!window.XLSX) return alert("Thư viện Excel đang tải, vui lòng thử lại sau giây lát.");
    if (!data) return alert("Không có dữ liệu để xuất Excel.");

    // Sheet 1: Tổng hợp nhân viên
    const wsUsersData = [
      ['STT', 'Họ và tên', 'Email', 'Vai trò', 'Lượt đăng nhập', 'Số lần in tem (trong kỳ)', 'Lần truy cập cuối', 'Lần đầu đăng nhập']
    ];
    data.users.forEach((u, idx) => {
      const isHieu = u.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' || (u.email && u.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn') || (u.name && u.name.includes('Hoàng Văn Hiếu'));
      wsUsersData.push([
        idx + 1,
        u.name || '',
        u.email || '',
        isHieu ? 'Quản trị viên (Hoàng Văn Hiếu)' : (u.role === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên'),
        u.login_count || 0,
        u.print_count || 0,
        u.last_login_at ? new Date(u.last_login_at).toLocaleString('vi-VN') : '',
        u.first_login_at ? new Date(u.first_login_at).toLocaleString('vi-VN') : ''
      ]);
    });

    // Sheet 2: Chi tiết nhật ký hoạt động
    const wsLogsData = [
      ['STT', 'Thời gian', 'Người dùng', 'Hành động', 'Mẫu tem', 'Số lượng tem', 'Cửa hàng', 'Loại CTKM', 'Chi tiết bổ sung', 'Địa chỉ IP']
    ];
    data.recentLogs.forEach((l, idx) => {
      const details = l.details || {};
      wsLogsData.push([
        idx + 1,
        l.created_at ? new Date(l.created_at).toLocaleString('vi-VN') : '',
        l.user_name || '',
        l.action === 'LOGIN' ? 'Đăng nhập' : l.action === 'PRINT_TEM' ? 'In tem' : l.action,
        details.template || '',
        details.tagCount || '',
        details.store || '',
        details.promoType || '',
        JSON.stringify(details),
        l.ip_address || ''
      ]);
    });

    const wb = window.XLSX.utils.book_new();
    const ws1 = window.XLSX.utils.aoa_to_sheet(wsUsersData);
    const ws2 = window.XLSX.utils.aoa_to_sheet(wsLogsData);

    window.XLSX.utils.book_append_sheet(wb, ws1, "TongHopNhanVien");
    window.XLSX.utils.book_append_sheet(wb, ws2, "ChiTietNhatKy");

    const fileName = `Bao_cao_truy_cap_va_in_tem_${startDate || 'tat_ca'}_den_${endDate || 'tat_ca'}.xlsx`;
    window.XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-base font-bold text-[#10285B]">Thống kê Hoạt động & Phân quyền Quản trị</h2>
              <p className="text-xs text-gray-500">Chỉ định quyền Admin (toàn quyền) & Theo dõi hoạt động theo ngày</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Thanh công cụ lọc ngày & Nút xuất Excel */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-gray-700">Lọc theo ngày:</span>
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
              <span className="text-gray-400">Từ</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="outline-none bg-transparent text-gray-700 text-xs cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
              <span className="text-gray-400">Đến</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="outline-none bg-transparent text-gray-700 text-xs cursor-pointer"
              />
            </div>

            {/* Nút lọc nhanh */}
            <div className="flex items-center gap-1 ml-1">
              <button onClick={() => setQuickRange('today')} className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded font-medium">Hôm nay</button>
              <button onClick={() => setQuickRange('7days')} className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded font-medium">7 ngày</button>
              <button onClick={() => setQuickRange('month')} className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded font-medium">Tháng này</button>
              <button onClick={() => setQuickRange('all')} className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded font-medium">Tất cả</button>
            </div>
          </div>

          {/* Nút Xuất Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span>Xuất Excel ({startDate || 'Toàn bộ'} ➔ {endDate || 'Hiện tại'})</span>
          </button>
        </div>

        {/* Nội dung thống kê */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <div className="w-10 h-10 border-4 border-[#E0376F] border-t-transparent rounded-full animate-spin mb-3"></div>
              <span>Đang tính toán số liệu thống kê...</span>
            </div>
          ) : data ? (
            <>
              {/* Thẻ tóm tắt */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20">👥</div>
                  <div>
                    <div className="text-2xl font-black text-blue-900">{data.summary.totalUsers}</div>
                    <div className="text-xs font-semibold text-blue-700">Tổng nhân viên đã đăng nhập</div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-emerald-500/20">🔑</div>
                  <div>
                    <div className="text-2xl font-black text-emerald-900">{data.summary.totalLogins}</div>
                    <div className="text-xs font-semibold text-emerald-700">Lượt đăng nhập (trong kỳ)</div>
                  </div>
                </div>

                <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#E0376F] text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-pink-500/20">🖨️</div>
                  <div>
                    <div className="text-2xl font-black text-pink-900">{data.summary.totalPrints}</div>
                    <div className="text-xs font-semibold text-pink-700">Số lần in tem (trong kỳ)</div>
                  </div>
                </div>
              </div>

              {/* Tabs chuyển đổi */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setTab('users')}
                  className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-colors ${tab === 'users' ? 'border-[#E0376F] text-[#E0376F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Danh sách Nhân viên & Phân quyền ({data.users.length})
                </button>
                <button
                  onClick={() => setTab('logs')}
                  className={`py-2.5 px-4 font-bold text-sm border-b-2 transition-colors ${tab === 'logs' ? 'border-[#E0376F] text-[#E0376F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Nhật ký hoạt động chi tiết ({data.recentLogs.length})
                </button>
              </div>

              {tab === 'users' ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Nhân viên</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4 text-center">Vai trò</th>
                        <th className="py-3 px-4 text-center">Lượt đăng nhập</th>
                        <th className="py-3 px-4 text-center">Số lần in tem</th>
                        <th className="py-3 px-4 text-right">Lần truy cập cuối</th>
                        <th className="py-3 px-4 text-center">Phân quyền Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.users.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-gray-400">Chưa có người dùng nào đăng nhập</td></tr>
                      ) : (
                        data.users.map(u => {
                          const isHieu = u.open_id === 'ou_07ff157813f7a579760d5e076f2e0860' || (u.email && u.email.toLowerCase() === 'hieuhv2@sakukovietnam.com.vn') || (u.name && u.name.includes('Hoàng Văn Hiếu'));
                          const isAdmin = isHieu || u.role === 'admin';

                          return (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <img
                                  src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                                  className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                  alt=""
                                />
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-800">{u.name}</span>
                                  {isHieu && <span className="text-[10px] text-purple-600 font-bold">Quản trị viên chính</span>}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-500 text-xs">{u.email || '—'}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isAdmin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isAdmin ? '👑 Admin' : 'Nhân viên'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-blue-600">{u.login_count}</td>
                              <td className="py-3 px-4 text-center font-bold text-pink-600">{u.print_count}</td>
                              <td className="py-3 px-4 text-right text-xs text-gray-500 font-mono">
                                {new Date(u.last_login_at).toLocaleString('vi-VN')}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isHieu ? (
                                  <span className="text-xs text-gray-400 font-medium italic">Toàn quyền</span>
                                ) : (
                                  <button
                                    onClick={() => handleToggleRole(u)}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors ${
                                      u.role === 'admin' 
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    }`}
                                  >
                                    {u.role === 'admin' ? 'Hạ quyền' : '👑 Thăng Admin'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Người dùng</th>
                        <th className="py-3 px-4">Hành động</th>
                        <th className="py-3 px-4">Chi tiết</th>
                        <th className="py-3 px-4 text-right">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {data.recentLogs.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">Không có hoạt động nào trong khoảng thời gian đã chọn</td></tr>
                      ) : (
                        data.recentLogs.map(l => (
                          <tr key={l.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4 text-gray-500 font-mono whitespace-nowrap">
                              {new Date(l.created_at).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-gray-800 whitespace-nowrap">{l.user_name}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                l.action === 'LOGIN' ? 'bg-blue-100 text-blue-800' :
                                l.action === 'PRINT_TEM' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {l.action === 'LOGIN' ? 'Đăng nhập' : l.action === 'PRINT_TEM' ? 'In tem' : l.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-gray-600 font-mono max-w-xs truncate">
                              {l.details ? JSON.stringify(l.details) : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-400 font-mono whitespace-nowrap">
                              {l.ip_address || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-red-500 font-medium">
              {errorMsg || 'Bạn không có quyền xem thống kê hoặc phiên làm việc đã hết hạn.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  // Lark Auth & Tracking State
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const checkAuth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/auth/me', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.loggedIn && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Lỗi auth/me:', err);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (err) {
      console.error('Lỗi logout:', err);
    }
  };

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
    else if (promoType === 'Combo') setPromoSize('100x80');
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
    if (!price || !original) return 0;
    const p = parseFloat(String(price).replace(/[^\d.]/g, ''));
    const o = parseFloat(String(original).replace(/[^\d.]/g, ''));
    if (!o || isNaN(p) || isNaN(o) || p >= o) return 0;
    return Math.round(((o - p) / o) * 100);
  };

  // Hàm rút gọn ngày áp dụng chỉ lấy ngày và tháng (bỏ năm), ví dụ: 01/10 - 31/10
  const formatDateRangeShort = (raw) => {
    if (!raw) return '01/10 - 31/10';
    let s = String(raw).trim();
    s = s.replace(/^(áp dụng\s*:?\s*)/i, '');
    s = s.replace(/(\d{1,2}\/\d{1,2})\/\d{2,4}/g, (_, d) => d);
    s = s.replace(/\s*-\s*/g, ' - ');
    return s.trim();
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
        const mappedData = data.map(p => {
          const sDate = parseDateValue(p.start_date);
          const eDate = parseDateValue(p.end_date);
          let dateStr = '';
          if (p.dateRange) dateStr = String(p.dateRange).trim();
          else if (sDate && eDate) dateStr = `${sDate} - ${eDate}`;
          else if (sDate) dateStr = String(sDate);

          return {
            barcode: String(p.barcode || '').trim(),
            name: String(p.item_name || p.name || '').trim(),
            originalPrice: (p.retail_price !== undefined && p.retail_price !== null && p.retail_price !== '') ? String(p.retail_price).trim() : (p.originalPrice ? String(p.originalPrice).trim() : ''),
            price: (p.promo_price !== undefined && p.promo_price !== null && p.promo_price !== '') ? String(p.promo_price).trim() : (p.price ? String(p.price).trim() : '0'),
            dateRange: dateStr,
            promoContent: String(p.promo_content || p.type || '').trim(),
            discountPercent: String(p.discount_percent || p.discountPercent || '').trim(),
            discountAmount: String(p.discount_amount || p.discountAmount || '').trim(),
            unit: String(p.unit || p.uom || '').trim()
          };
        });

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
        const han = parseDateValue(row["Hạn áp dụng"] || row["Thời gian áp dụng"] || row["Hạn sử dụng"]);
        
        const rawName = row["Tên SP"] || row["Tên sản phẩm"] || row["Tên hàng"] || row["Tên hàng hóa"] || row["Sản phẩm"] || '';
        const rawBarcode = row["Barcode"] || row["Mã vạch"] || row["Mã SP"] || row["Mã sản phẩm"] || row["Mã hàng"] || '';
        const rawPrice = row["Giá mới"] || row["Giá bán"] || row["Giá KM"] || row["Giá khuyến mãi"] || row["Đơn giá"] || row["Giá"] || '';
        const rawOriginalPrice = row["Giá cũ"] || row["Giá gốc"] || row["Giá niêm yết"] || row["Giá niêm yet"] || '';
        const rawDiscountPercent = row["% Giảm"] || row["% giảm"] || row["Phần trăm giảm"] || '';
        const rawUnit = row["Đơn vị"] || row["ĐVT"] || row["Đơn vị tính"] || '';
        const rawType = row["USP"] || row["Đặc điểm (USP)"] || row["Đặc điểm"] || '';
        const rawPromo = row["Nội dung CTKM"] || row["CTKM"] || row["Nội dung khuyến mãi"] || '';
        const rawDiscountAmount = row["Tiền giảm"] || row["Tiết kiệm"] || row["discount_amount"] || row["Số tiền giảm"] || '';

        let dateStr = '';
        if (han) dateStr = String(han);
        else if (start && end) dateStr = `${start} - ${end}`;
        else if (start) dateStr = String(start);

        return {
          id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name: String(rawName).trim(),
          barcode: String(rawBarcode).trim(),
          price: (rawPrice !== '' && rawPrice !== null && rawPrice !== undefined) ? String(rawPrice).trim() : '0',
          originalPrice: (rawOriginalPrice !== '' && rawOriginalPrice !== null && rawOriginalPrice !== undefined) ? String(rawOriginalPrice).trim() : '',
          discountPercent: String(rawDiscountPercent || '').trim(),
          unit: String(rawUnit || '').trim(),
          type: String(rawType || '').trim(),
          dateRange: dateStr.trim(),
          promoContent: (/^0\.\d+$/.test(String(rawPromo || '').trim()) ? '' : String(rawPromo || '').trim()),
          discountAmount: String(rawDiscountAmount || '').trim(),
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
        pagePadding = { x: 15, y: 10 };
        tagGap = 2;
    } else if (selectedTemplate === 'normal_small') {
        baseTag = { w: 600, h: 300 };
        targetWidthMm = 50;
        targetHeightMm = 24.15;
    } else if (selectedTemplate === 'sale_60x70') {
        baseTag = { w: 600, h: 700 };
        targetWidthMm = 60;
        targetHeightMm = 70;
        pagePadding = { 
            left: 57, 
            right: 57, 
            top: 32, 
            bottom: 32 
        };
        tagGap = 0;
    } else if (selectedTemplate === 'sale_50x80') {
        baseTag = { w: 500, h: 800 };
        targetWidthMm = 50;
        targetHeightMm = 80;
        pagePadding = { 
            left: 19, 
            right: 19, 
            top: 108, 
            bottom: 108 
        };
        tagGap = 0;
    } else if (selectedTemplate === 'sale_80x50') {
        baseTag = { w: 800, h: 500 };
        targetWidthMm = 80;
        targetHeightMm = 50;
        pagePadding = { 
            left: 94, 
            right: 94, 
            top: 89, 
            bottom: 89 
        };
        tagGap = 0;
    }
    const pxPerMm = 96 / 25.4;
    scaledTagWidth = targetWidthMm * pxPerMm;
    scaleFactor = scaledTagWidth / baseTag.w;
    scaledTagHeight = baseTag.h * scaleFactor;
  } else {
    if (promoSize === '100x80') {
       pagePadding = { x: 8, y: 15 };
       tagGap = 3;
       baseTag = { w: 1000, h: 800 };
       const targetWidthMm = 100;
       const targetHeightMm = 80;
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
  }

  const padTop = pagePadding.top !== undefined ? pagePadding.top : (pagePadding.y !== undefined ? pagePadding.y : 0);
  const padBottom = pagePadding.bottom !== undefined ? pagePadding.bottom : (pagePadding.y !== undefined ? pagePadding.y : 0);
  const padLeft = pagePadding.left !== undefined ? pagePadding.left : (pagePadding.x !== undefined ? pagePadding.x : 0);
  const padRight = pagePadding.right !== undefined ? pagePadding.right : (pagePadding.x !== undefined ? pagePadding.x : 0);

  const availableWidth = currentPaper.w - (padLeft + padRight);
  let tagsPerRow = Math.floor((availableWidth + tagGap) / (scaledTagWidth + tagGap));
  if (tagsPerRow < 1) tagsPerRow = 1;

  const availableHeight = currentPaper.h - (padTop + padBottom);
  let rowsPerPage = Math.floor((availableHeight + tagGap) / (scaledTagHeight + tagGap));
  if (rowsPerPage < 1) rowsPerPage = 1; 

  if (selectedTemplate === 'sale_60x70') {
    tagsPerRow = 3;
    rowsPerPage = 4;
  } else if (selectedTemplate === 'sale_50x80') {
    tagsPerRow = 4;
    rowsPerPage = 3;
  } else if (selectedTemplate === 'sale_80x50') {
    tagsPerRow = 2;
    rowsPerPage = 5;
  }
  const itemsPerPage = rowsPerPage * tagsPerRow;

  const getPaginatedTags = () => {
      const tags = getTagsToRender();
      const pages = [];
      for (let i = 0; i < tags.length; i += itemsPerPage) {
          pages.push(tags.slice(i, i + itemsPerPage));
      }
      return pages;
  };

  const isBarcodeNeeded = !isSpecialPromo 
    ? (!['sale_60x70', 'sale_50x80'].includes(selectedTemplate))
    : false;

  const uniqueBarcodes = React.useMemo(() => {
    if (!isBarcodeNeeded) return [];
    return [...new Set(products.map(p => p.barcode).filter(Boolean))];
  }, [products, isBarcodeNeeded]);

  const loadedBarcodesCount = uniqueBarcodes.filter(bc => loadedBarcodes.has(bc)).length;
  const totalBarcodesCount = uniqueBarcodes.length;
  const isAllBarcodesLoaded = !isBarcodeNeeded || totalBarcodesCount === 0 || loadedBarcodesCount >= totalBarcodesCount;

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
    } else if (selectedTemplate === 'sale_80x50') {
      scale = 3.5; bcHeight = 15; textsize = 11;
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

  const BarcodeImage = ({ barcode, className = "h-24", scale = 4, bcHeight = 16, textsize = '' }) => {
      const cleanBarcode = String(barcode || '').trim();
      if (!cleanBarcode) {
        return <div className={`${className} flex items-center justify-center text-gray-400 text-xs italic`}>Không có mã vạch</div>;
      }
      return (
        <img 
            src={`/api/barcode?text=${encodeURIComponent(cleanBarcode)}&scale=${scale}&height=${bcHeight}${textsize ? `&textsize=${textsize}` : ''}`} 
            alt="barcode" 
            className={`${className} w-full object-contain mix-blend-multiply`} 
            crossOrigin="anonymous" 
            onLoad={() => {
              if (!loadedBarcodes.has(cleanBarcode)) {
                setLoadedBarcodes(prev => {
                  const next = new Set(prev);
                  next.add(cleanBarcode);
                  return next;
                });
              }
            }}
            onError={() => {
              if (!loadedBarcodes.has(cleanBarcode)) {
                setLoadedBarcodes(prev => {
                  const next = new Set(prev);
                  next.add(cleanBarcode);
                  return next;
                });
              }
            }}
        />
      );
  };

  const getTitleSize = (name, baseSize) => {
      const len = name ? String(name).length : 0;
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
    const priceStr = String(product.price || '');
    if (priceStr.endsWith('000') && priceStr.length > 3) {
        priceMain = formatCurrency(parseInt(priceStr.slice(0, -3)));
        priceSub = ".000đ";
    }

    let showPromoText = false;
    let ribbonSub = discount + '%';
    
    if (product.promoContent) {
        const rawPC = String(product.promoContent || '');
        const pc = rawPC.trim().toLowerCase();
        if (/^(giảm\s*)?\d+%$/.test(pc)) {
            ribbonSub = rawPC.replace(/[^\d%]/g, '');
        } else {
            showPromoText = true;
        }
    }

    return (
      <div className="w-full h-full bg-white border-[4px] border-black flex flex-col overflow-hidden box-border relative">
        <div className="bg-black text-white text-center font-black text-[55px] uppercase tracking-widest py-1 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        <div className="px-6 pt-1 pb-0 text-center font-bold text-[30px] text-black line-clamp-2 break-words shrink-0 leading-tight min-h-[66px]" style={{ overflowWrap: 'anywhere' }}>
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
           <div className="flex flex-col items-end justify-start flex-1 ml-2 relative">
              <div className="flex items-baseline text-black justify-end w-full mt-0.5">
                  <span 
                    className={`font-black tracking-tighter leading-none shrink-0 ${
                      showPromoText 
                        ? (priceMain.length >= 6 ? 'text-[50px]' : priceMain.length >= 4 ? 'text-[64px]' : 'text-[76px]') 
                        : (priceMain.length >= 6 ? 'text-[62px]' : priceMain.length >= 4 ? 'text-[76px]' : 'text-[90px]')
                    }`} 
                    style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}
                  >
                    {priceMain}
                  </span>
                  <span 
                    className={`font-bold ml-0.5 shrink-0 ${
                      showPromoText 
                        ? (priceMain.length >= 6 ? 'text-[24px]' : priceMain.length >= 4 ? 'text-[28px]' : 'text-[32px]') 
                        : (priceMain.length >= 6 ? 'text-[28px]' : priceMain.length >= 4 ? 'text-[34px]' : 'text-[38px]')
                    }`}
                  >
                    {priceSub}
                  </span>
              </div>
              <div className="text-right text-black text-[22px] font-bold shrink-0 leading-tight mt-1">
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
                  {product.dateRange ? `Áp dụng: ${formatDateRangeShort(product.dateRange)}` : 'Áp dụng: 01/10 - 31/10'}
               </div>
               {product.unit ? (
                  <div className="text-right min-w-[50px] mb-1">
                     {String(product.unit).startsWith('/') ? product.unit : `/${product.unit}`}
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
    
    // Tách giá thông minh
    const priceStr = formatCurrency(product.price);
    let priceMain = priceStr;
    let priceSub = "đ";
    const lastDotIndex = priceStr.lastIndexOf('.');
    if (lastDotIndex !== -1 && priceStr.length - lastDotIndex === 4) {
        priceMain = priceStr.slice(0, lastDotIndex);
        priceSub = priceStr.slice(lastDotIndex) + "đ";
    }

    let showPromoText = false;
    let ribbonSub = discount + '%';
    
    if (product.promoContent) {
        const rawPC = String(product.promoContent || '');
        const pc = rawPC.trim().toLowerCase();
        if (/^(giảm\s*)?\d+%$/.test(pc)) {
            ribbonSub = rawPC.replace(/[^\d%]/g, '');
        } else {
            showPromoText = true;
        }
    }

    const hasPromoLeft = showPromoText || discount > 0 || (ribbonSub && ribbonSub !== '0%');

    // Tự co giãn cỡ chữ tên sản phẩm theo độ dài để to rõ và không bao giờ bị cắt chữ
    const nameLen = String(product.name || '').length;
    let nameSize = 'text-[42px]';
    if (nameLen > 65) nameSize = 'text-[28px]';
    else if (nameLen > 45) nameSize = 'text-[32px]';
    else if (nameLen > 28) nameSize = 'text-[37px]';

    return (
      <div className="w-full h-full bg-white border-[5px] border-black flex flex-col justify-between overflow-hidden box-border relative font-sans text-black select-none">
        
        {/* Header BIG SALE */}
        <div className="bg-black text-white text-center font-black text-[86px] uppercase tracking-widest py-2 leading-none shrink-0" style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}>
          BIG SALE!
        </div>
        
        {/* Tên sản phẩm to rõ ràng, cân đối */}
        <div 
          className={`px-6 pt-2 pb-1 text-center font-bold ${nameSize} text-black line-clamp-2 break-words shrink-0 leading-snug min-h-[92px] flex items-center justify-center`} 
          style={{ overflowWrap: 'anywhere', fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}
        >
          {product.name}
        </div>
        
        {/* Khu vực trung tâm: Ô khuyến mãi + Giá bán lấp đầy không gian hài hòa */}
        <div className="flex-1 flex flex-col justify-center px-6 py-1 my-auto">
           {hasPromoLeft ? (
              <div className="flex w-full justify-between items-center">
                  {showPromoText ? (
                     <div className="relative flex flex-col items-center justify-center w-[230px] shrink-0 border-[4px] border-black rounded-[8px] bg-white px-3 py-3 min-h-[170px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                         <span className="text-[17px] font-black uppercase tracking-wider bg-black text-white px-2.5 py-0.5 rounded-[4px] mb-2 leading-none">
                             Ưu đãi
                         </span>
                         <span 
                           className={`text-black font-extrabold leading-tight text-center break-words w-full uppercase ${
                             (product.promoContent || '').length > 45 ? 'text-[20px]' : (product.promoContent || '').length > 25 ? 'text-[24px]' : 'text-[28px]'
                           }`}
                           style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}
                         >
                             {product.promoContent}
                         </span>
                     </div>
                  ) : (
                     <div className="relative flex flex-col items-center justify-center w-[155px] h-[185px] shrink-0">
                         <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                             <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                         </svg>
                         <span className="relative z-10 text-white font-bold text-[30px] leading-none uppercase mt-[-15px]">Giảm</span>
                         <span className="relative z-10 text-white font-black leading-none mt-1.5 text-[66px] tracking-tighter">{ribbonSub}</span>
                     </div>
                  )}
                  
                  {/* Khối giá bán phóng to nổi bật */}
                  <div className="flex flex-col items-end justify-center flex-1 ml-5">
                     <div className="flex items-baseline text-black justify-end w-full">
                         <span 
                           className={`font-black tracking-tighter leading-none shrink-0 ${
                             priceMain.length > 6 ? 'text-[92px]' : priceMain.length >= 4 ? 'text-[116px]' : 'text-[132px]'
                           }`} 
                           style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}
                         >
                           {priceMain}
                         </span>
                         <span 
                           className={`font-bold ml-1.5 shrink-0 ${
                             priceMain.length >= 4 ? 'text-[52px]' : 'text-[60px]'
                           }`}
                           style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}
                         >
                           {priceSub}
                         </span>
                     </div>
                     <div className="text-right text-black font-bold shrink-0 leading-tight mt-2.5">
                        {product.originalPrice ? (
                            <span className="text-[34px]">Giá niêm yết: <span className="line-through decoration-[3px] text-gray-700">{formatCurrency(product.originalPrice)}đ</span></span>
                        ) : (
                            <span>&nbsp;</span>
                        )}
                     </div>
                  </div>
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center w-full py-2">
                  <div className="flex items-baseline text-black justify-center w-full">
                      <span 
                        className={`font-black tracking-tighter leading-none shrink-0 ${
                          priceMain.length > 6 ? 'text-[120px]' : priceMain.length >= 4 ? 'text-[145px]' : 'text-[160px]'
                        }`} 
                        style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}
                      >
                        {priceMain}
                      </span>
                      <span 
                        className={`font-bold ml-2 shrink-0 ${
                          priceMain.length >= 4 ? 'text-[62px]' : 'text-[72px]'
                        }`}
                        style={{ fontFamily: 'Arial Black, Impact, sans-serif' }}
                      >
                        {priceSub}
                      </span>
                  </div>
                  {product.originalPrice ? (
                      <div className="text-center text-black text-[38px] font-bold shrink-0 leading-tight mt-3">
                         <span>Giá niêm yết: <span className="line-through decoration-[3px] text-gray-700">{formatCurrency(product.originalPrice)}đ</span></span>
                      </div>
                  ) : null}
              </div>
           )}
           
           {/* Dòng USP nếu có */}
           {product.type ? (
              <div className="w-full mt-3 flex justify-start px-2">
                  <div 
                    className="font-bold text-[34px] text-black w-full text-left leading-tight break-words line-clamp-2" 
                    style={{ overflowWrap: 'anywhere', fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}
                  >
                      *{product.type}
                  </div>
              </div>
           ) : null}
        </div>
        
        {/* Chân tem: Mã vạch + Thời gian áp dụng to rõ, căn đều đẹp */}
        <div className="mx-6 mb-3 mt-auto flex items-end shrink-0">
            <div className="w-[280px] shrink-0">
                <BarcodeImage barcode={product.barcode} className="h-[110px] ml-[-10px]" scale={5} bcHeight={16} textsize={15} />
            </div>
            <div 
              className="flex-1 flex justify-between items-end border-t-[4px] border-black pb-2 pt-2 ml-5 text-black font-bold"
              style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}
            >
               <div className="flex-1 px-1 whitespace-nowrap overflow-hidden text-ellipsis mb-0.5 text-center">
                  <span className="text-[27px] font-bold text-black tracking-tight">
                     {product.dateRange ? `Áp dụng: ${formatDateRangeShort(product.dateRange)}` : 'Áp dụng: 01/10 - 31/10'}
                  </span>
               </div>
               {product.unit ? (
                  <div className="text-right min-w-[65px] mb-0.5 text-[26px] font-bold text-black ml-2 shrink-0">
                     {String(product.unit).startsWith('/') ? product.unit : `/${product.unit}`}
                  </div>
               ) : null}
            </div>
        </div>
      </div>
    );
  };

  const TemplateSale60x70 = ({ product }) => {
    const numPrice = parseFloat(String(product.price || 0).replace(/[^\d]/g, '')) || 0;
    const numOriginalPrice = parseFloat(String(product.originalPrice || 0).replace(/[^\d]/g, '')) || 0;
    
    // Tách phần số chính và 3 chữ số đằng sau để hiển thị nhỏ gọn cân đối
    const priceStr = formatCurrency(product.price);
    let priceMain = priceStr;
    let priceDec = '';
    let hasDec = false;
    const lastDotIndex = priceStr.lastIndexOf('.');
    if (lastDotIndex !== -1 && priceStr.length - lastDotIndex === 4) {
      priceMain = priceStr.slice(0, lastDotIndex);
      priceDec = priceStr.slice(lastDotIndex); // ví dụ: ".000"
      hasDec = true;
    }

    // Giá cũ gạch ngang rõ ràng: ví dụ 150.000đ
    const oldPriceText = numOriginalPrice > 0 ? formatCurrency(product.originalPrice) : '';

    // Số tiền tiết kiệm (ưu tiên discountAmount từ database: discount_amount)
    let savingDisplay = '';
    if (product.discountAmount) {
      const numSaving = parseFloat(String(product.discountAmount).replace(/[^\d]/g, '')) || 0;
      if (numSaving > 0) savingDisplay = formatCurrency(numSaving);
    }
    if (!savingDisplay && numOriginalPrice > numPrice) {
      savingDisplay = formatCurrency(numOriginalPrice - numPrice);
    }

    // Tự co giãn cỡ chữ tên sản phẩm theo độ dài
    const nameLen = String(product.name || '').length;
    let nameFontSize = '12px';
    if (nameLen > 55) nameFontSize = '9.5px';
    else if (nameLen > 38) nameFontSize = '10.5px';

    return (
      <div 
        className="w-full h-full bg-white flex flex-col justify-between box-border select-none overflow-hidden" 
        style={{ 
          border: '1px solid black', 
          padding: '1.5mm 2mm',
          fontFamily: "Arial, Tahoma, sans-serif",
          color: 'black'
        }}
      >
        {/* Tên sản phẩm - đệm lề an toàn */}
        <div 
          className="text-center font-bold leading-tight line-clamp-2 px-1 text-black shrink-0 flex items-center justify-center"
          style={{ 
            fontSize: nameFontSize,
            minHeight: '22px',
            overflowWrap: 'anywhere', 
            wordBreak: 'break-word'
          }}
        >
          {product.name}
        </div>

        {/* Vạch ngang ngăn cách */}
        <div style={{ borderBottom: '1px solid black', margin: '1px 0' }} className="w-full shrink-0"></div>

        {/* Mã sản phẩm */}
        <div className="flex items-center justify-center gap-2 px-1 text-black shrink-0 text-center" style={{ fontSize: '9px', fontWeight: 'bold' }}>
           <span>Mã SP</span>
           <span className="font-mono tracking-wider">{product.barcode}</span>
        </div>

        {/* Khung đen chữ trắng BIG SALE */}
        <div className="flex justify-center items-center my-0.5 shrink-0 w-full px-1">
           <div 
             className="relative w-[92%] bg-black text-white rounded-[4px] shadow-sm flex items-center justify-center overflow-hidden"
             style={{ padding: '2px 4px' }}
           >
              <div className="w-full border border-white/90 rounded-[3px] py-0.5 px-1.5 flex items-center justify-center gap-1.5">
                 <span style={{ fontSize: '8px' }} className="select-none text-white leading-none">★</span>
                 <span 
                   className="font-black tracking-[0.16em] uppercase italic leading-none text-center" 
                   style={{ fontSize: '16px', fontFamily: 'Arial Black, Impact, sans-serif' }}
                 >
                    BIG SALE
                 </span>
                 <span style={{ fontSize: '8px' }} className="select-none text-white leading-none">★</span>
              </div>
           </div>
        </div>

        {/* Khu vực giá khuyến mãi */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-1 my-auto">
           <div className="text-black font-black tracking-tight text-center leading-none flex items-baseline justify-center">
             <span 
               style={{ 
                 fontSize: priceMain.length <= 2 ? '54px' : priceMain.length === 3 ? '46px' : priceMain.length <= 5 ? '38px' : '30px',
                 fontFamily: 'Arial Black, Impact, sans-serif' 
               }}
             >
               {priceMain}
             </span>
             {hasDec ? (
               <span className="flex items-baseline ml-0.5">
                 <span 
                   style={{ 
                     fontSize: priceMain.length <= 2 ? '18px' : priceMain.length === 3 ? '16px' : '14px',
                     fontFamily: 'Arial Black, Impact, sans-serif' 
                   }}
                 >
                   {priceDec}
                 </span>
                 <span 
                   className="font-bold ml-0.5"
                   style={{ fontSize: '13px' }}
                 >
                   đ
                 </span>
               </span>
             ) : (
               <span 
                 className="font-bold ml-1"
                 style={{ fontSize: '15px' }}
               >
                 đ
               </span>
             )}
           </div>

           {oldPriceText ? (
             <div className="text-center text-gray-700 font-bold tracking-tight leading-none px-1 mt-0.5" style={{ fontSize: '11px' }}>
               <span className="line-through decoration-[1.5px]">{oldPriceText}đ</span>
             </div>
           ) : (
             <div style={{ height: '4px' }}></div>
           )}
        </div>

        {/* Ô tiết kiệm */}
        {savingDisplay ? (
          <div 
            className="w-[92%] mx-auto rounded-[3px] flex items-baseline justify-center gap-1.5 shrink-0 shadow-sm"
            style={{ 
              border: '1px solid black', 
              padding: '2px 4px', 
              marginBottom: '2px' 
            }}
          >
            <span style={{ fontSize: '9.5px' }} className="font-black text-black uppercase tracking-wider">Tiết kiệm:</span>
            <span style={{ fontSize: '13px', fontFamily: 'Arial Black, Impact, sans-serif' }} className="font-black text-black leading-none">{savingDisplay}</span>
            <span style={{ fontSize: '9px' }} className="font-bold text-black">đ</span>
          </div>
        ) : (
          <div style={{ height: '2px' }}></div>
        )}

        {/* Thời gian áp dụng */}
        <div className="text-center text-black px-1 shrink-0">
           <div style={{ fontSize: '7px' }} className="text-gray-700 font-medium leading-tight">Thời gian áp dụng:</div>
           <div style={{ fontSize: '8.5px', fontFamily: 'Arial Black, Impact, sans-serif' }} className="font-bold leading-tight mt-0.5">
             {product.dateRange ? formatDateRangeShort(product.dateRange) : 'Áp dụng: Liên hệ'}
           </div>
        </div>

      </div>
    );
  };

  const TemplateSale50x80 = ({ product }) => {
    const numPrice = parseFloat(String(product.price || 0).replace(/[^\d]/g, '')) || 0;
    const numOriginalPrice = parseFloat(String(product.originalPrice || 0).replace(/[^\d]/g, '')) || 0;
    
    // Tách phần số chính và 3 chữ số đằng sau để hiển thị nhỏ gọn cân đối
    const priceStr = formatCurrency(product.price);
    let priceMain = priceStr;
    let priceDec = '';
    let hasDec = false;
    const lastDotIndex = priceStr.lastIndexOf('.');
    if (lastDotIndex !== -1 && priceStr.length - lastDotIndex === 4) {
      priceMain = priceStr.slice(0, lastDotIndex);
      priceDec = priceStr.slice(lastDotIndex); // ví dụ: ".000"
      hasDec = true;
    }

    // Giá cũ gạch ngang rõ ràng: ví dụ 150.000đ
    const oldPriceText = numOriginalPrice > 0 ? formatCurrency(product.originalPrice) : '';

    // Số tiền tiết kiệm (ưu tiên discountAmount từ database: discount_amount)
    let savingDisplay = '';
    if (product.discountAmount) {
      const numSaving = parseFloat(String(product.discountAmount).replace(/[^\d]/g, '')) || 0;
      if (numSaving > 0) savingDisplay = formatCurrency(numSaving);
    }
    if (!savingDisplay && numOriginalPrice > numPrice) {
      savingDisplay = formatCurrency(numOriginalPrice - numPrice);
    }

    // Tự co giãn cỡ chữ tên sản phẩm theo độ dài cho khổ 50mm
    const nameLen = String(product.name || '').length;
    let nameFontSize = '11px';
    if (nameLen > 55) nameFontSize = '8.5px';
    else if (nameLen > 38) nameFontSize = '9.5px';

    return (
      <div 
        className="w-full h-full bg-white flex flex-col justify-between box-border select-none overflow-hidden" 
        style={{ 
          border: '1px solid black', 
          padding: '1.5mm 1.5mm',
          fontFamily: "Arial, Tahoma, sans-serif",
          color: 'black'
        }}
      >
        {/* Tên sản phẩm */}
        <div 
          className="text-center font-bold leading-tight line-clamp-2 px-1 text-black shrink-0 flex items-center justify-center"
          style={{ 
            fontSize: nameFontSize,
            minHeight: '24px',
            overflowWrap: 'anywhere', 
            wordBreak: 'break-word'
          }}
        >
          {product.name}
        </div>

        {/* Vạch ngang ngăn cách */}
        <div style={{ borderBottom: '1px solid black', margin: '1px 0' }} className="w-full shrink-0"></div>

        {/* Mã sản phẩm */}
        <div className="flex items-center justify-center gap-1.5 px-0.5 text-black shrink-0 text-center" style={{ fontSize: '8.5px', fontWeight: 'bold' }}>
           <span>Mã SP</span>
           <span className="font-mono tracking-wider">{product.barcode}</span>
        </div>

        {/* Khung đen chữ trắng BIG SALE */}
        <div className="flex justify-center items-center my-0.5 shrink-0 w-full px-0.5">
           <div 
             className="relative w-[95%] bg-black text-white rounded-[3px] shadow-sm flex items-center justify-center overflow-hidden"
             style={{ padding: '2px 3px' }}
           >
              <div className="w-full border border-white/90 rounded-[2.5px] py-0.5 px-1 flex items-center justify-center gap-1">
                 <span style={{ fontSize: '7px' }} className="select-none text-white leading-none">★</span>
                 <span 
                   className="font-black tracking-[0.14em] uppercase italic leading-none text-center" 
                   style={{ fontSize: '14px', fontFamily: 'Arial Black, Impact, sans-serif' }}
                 >
                    BIG SALE
                 </span>
                 <span style={{ fontSize: '7px' }} className="select-none text-white leading-none">★</span>
              </div>
           </div>
        </div>

        {/* Khu vực giá khuyến mãi */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-0.5 my-auto">
           <div className="text-black font-black tracking-tight text-center leading-none flex items-baseline justify-center">
             <span 
               style={{ 
                 fontSize: priceMain.length <= 2 ? '48px' : priceMain.length === 3 ? '40px' : priceMain.length <= 5 ? '32px' : '26px',
                 fontFamily: 'Arial Black, Impact, sans-serif' 
               }}
             >
               {priceMain}
             </span>
             {hasDec ? (
               <span className="flex items-baseline ml-0.5">
                 <span 
                   style={{ 
                     fontSize: priceMain.length <= 2 ? '16px' : priceMain.length === 3 ? '14px' : '12px',
                     fontFamily: 'Arial Black, Impact, sans-serif' 
                   }}
                 >
                   {priceDec}
                 </span>
                 <span 
                   className="font-bold ml-0.5"
                   style={{ fontSize: '11px' }}
                 >
                   đ
                 </span>
               </span>
             ) : (
               <span 
                 className="font-bold ml-0.5"
                 style={{ fontSize: '13px' }}
               >
                 đ
               </span>
             )}
           </div>

           {oldPriceText ? (
             <div className="text-center text-gray-700 font-bold tracking-tight leading-none px-1 mt-1" style={{ fontSize: '10.5px' }}>
               <span className="line-through decoration-[1.5px]">{oldPriceText}đ</span>
             </div>
           ) : (
             <div style={{ height: '4px' }}></div>
           )}
        </div>

        {/* Ô tiết kiệm */}
        {savingDisplay ? (
          <div 
            className="w-[94%] mx-auto rounded-[3px] flex items-baseline justify-center gap-1 shrink-0 shadow-sm"
            style={{ 
              border: '1px solid black', 
              padding: '2px 3px', 
              marginBottom: '3px' 
            }}
          >
            <span style={{ fontSize: '8.5px' }} className="font-black text-black uppercase tracking-wider">Tiết kiệm:</span>
            <span style={{ fontSize: '11.5px', fontFamily: 'Arial Black, Impact, sans-serif' }} className="font-black text-black leading-none">{savingDisplay}</span>
            <span style={{ fontSize: '8.5px' }} className="font-bold text-black">đ</span>
          </div>
        ) : (
          <div style={{ height: '2px' }}></div>
        )}

        {/* Thời gian áp dụng */}
        <div className="text-center text-black px-1 shrink-0 mb-0.5">
           <div style={{ fontSize: '7px' }} className="text-gray-700 font-medium leading-tight">Thời gian áp dụng:</div>
           <div style={{ fontSize: '8px', fontFamily: 'Arial Black, Impact, sans-serif' }} className="font-bold leading-tight mt-0.5">
             {product.dateRange ? formatDateRangeShort(product.dateRange) : 'Áp dụng: Liên hệ'}
           </div>
        </div>

      </div>
    );
  };

  // 5.2. Tem Khuyến Mại Sale Thường Khổ Ngang Chuẩn (80x50mm - 10 tem/trang)
  const TemplateSale80x50 = ({ product }) => {
    let discount = getDiscountPercent(product.price, product.originalPrice);
    if (product.discountPercent) discount = parseInt(product.discountPercent, 10) || discount;
    
    // Tách phần số chính và 3 chữ số đằng sau
    const priceStr = formatCurrency(product.price);
    let priceMain = priceStr;
    let priceDec = '';
    let hasDec = false;
    const lastDotIndex = priceStr.lastIndexOf('.');
    if (lastDotIndex !== -1 && priceStr.length - lastDotIndex === 4) {
      priceMain = priceStr.slice(0, lastDotIndex);
      priceDec = priceStr.slice(lastDotIndex); // ví dụ: ".000"
      hasDec = true;
    }

    let showPromoText = false;
    let ribbonSub = discount + '%';
    
    if (product.promoContent) {
      const rawPC = String(product.promoContent || '');
      const pc = rawPC.trim().toLowerCase();
      if (/^(giảm\s*)?\d+%$/.test(pc)) {
        ribbonSub = rawPC.replace(/[^\d%]/g, '');
      } else {
        showPromoText = true;
      }
    }

    const hasRibbon = !showPromoText && (discount > 0 || (ribbonSub && ribbonSub !== '0%'));

    // Tự co giãn cỡ chữ tên sản phẩm (không bị cắt chữ)
    const nameLen = String(product.name || '').length;
    let nameFontSize = '13px';
    if (nameLen > 60) nameFontSize = '11px';
    else if (nameLen > 40) nameFontSize = '12px';

    return (
      <div 
        className="w-full h-full bg-white flex flex-col justify-between box-border select-none overflow-hidden" 
        style={{ 
          border: '1.2px solid black', 
          padding: 0,
          fontFamily: "Arial, Tahoma, sans-serif",
          color: 'black'
        }}
      >
        {/* Header BIG SALE! full tem tràn mép không để khoảng trắng */}
        <div 
          className="w-full bg-black text-white text-center font-black uppercase tracking-widest shrink-0 flex items-center justify-center" 
          style={{ 
            height: '9mm', 
            fontSize: '22px', 
            fontFamily: 'Arial Black, Impact, sans-serif', 
            letterSpacing: '0.12em' 
          }}
        >
          BIG SALE!
        </div>

        {/* Thân tem có đệm lề trong */}
        <div className="flex-1 min-h-0 flex flex-col justify-between px-2 pt-1 pb-1 box-border">
          {/* Tên sản phẩm - 2 dòng thoáng, rõ ràng, không bị cộc / cắt chữ */}
          <div 
            className="w-full text-center font-bold text-black break-words shrink-0 flex items-center justify-center" 
            style={{ 
              fontSize: nameFontSize, 
              lineHeight: '1.25',
              minHeight: '28px',
              maxHeight: '32px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflowWrap: 'anywhere',
              fontFamily: "Arial, Tahoma, sans-serif" 
            }}
          >
            {product.name}
          </div>

          {/* Hàng giữa: Ô Ưu Đãi (80px x 50px) / Nơ căn đều ngang với Khối Giá Bán */}
          <div className="w-full flex items-center justify-between my-auto">
            {/* Trái: Ô Ưu Đãi chuẩn 80px x 50px hoặc Nơ */}
            <div className="shrink-0 flex items-center justify-start" style={{ width: '80px', height: '50px' }}>
              {showPromoText ? (
                <div 
                  className="w-[80px] h-[50px] border-[1.5px] border-black bg-white flex items-center justify-center text-center overflow-hidden box-border p-1"
                >
                  <div 
                    className="text-black font-extrabold uppercase text-center break-words w-full"
                    style={{ 
                      fontSize: (product.promoContent || '').length > 40 ? '7px' : (product.promoContent || '').length > 25 ? '8px' : '9px',
                      fontFamily: "Tahoma, Arial, sans-serif",
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.12'
                    }}
                  >
                    {product.promoContent}
                  </div>
                </div>
              ) : hasRibbon ? (
                <div className="relative flex flex-col items-center justify-center" style={{ width: '16mm', height: '17.5mm' }}>
                  <svg className="absolute inset-0 w-full h-full text-black" viewBox="0 0 100 120" fill="currentColor" preserveAspectRatio="none">
                    <path d="M0,0 L100,0 L100,70 L50,120 L0,70 Z" />
                  </svg>
                  <span className="relative z-10 text-white font-bold leading-none uppercase mt-[-2px]" style={{ fontSize: '8px' }}>Giảm</span>
                  <span className="relative z-10 text-white font-black leading-none mt-0.5 tracking-tighter" style={{ fontSize: '16px', fontFamily: 'Arial Black, Impact, sans-serif' }}>{ribbonSub}</span>
                </div>
              ) : (
                <div style={{ width: '80px', height: '50px' }}></div>
              )}
            </div>

            {/* Phải: Khối Giá Bán to nổi bật căn đều ngang với Ưu Đãi */}
            <div className="flex flex-col items-end justify-center flex-1 pl-2">
              <div className="flex items-baseline text-black leading-none justify-end w-full">
                <span 
                  style={{ 
                    fontSize: priceMain.length > 5 ? '38px' : priceMain.length >= 4 ? '44px' : '52px',
                    fontFamily: 'Arial Black, Impact, sans-serif' 
                  }}
                  className="font-black tracking-tighter shrink-0"
                >
                  {priceMain}
                </span>
                {hasDec ? (
                  <span className="flex items-baseline ml-0.5 shrink-0">
                    <span 
                      style={{ 
                        fontSize: priceMain.length >= 4 ? '16px' : '18.5px',
                        fontFamily: 'Arial Black, Impact, sans-serif' 
                      }}
                    >
                      {priceDec}
                    </span>
                    <span 
                      className="font-bold ml-0.5"
                      style={{ fontSize: '16px' }}
                    >
                      đ
                    </span>
                  </span>
                ) : (
                  <span 
                    className="font-bold ml-0.5"
                    style={{ fontSize: '18px' }}
                  >
                    đ
                  </span>
                )}
              </div>
              <div className="text-right text-black font-semibold shrink-0 leading-tight mt-1" style={{ fontSize: '12px' }}>
                {product.originalPrice ? (
                  <span>Giá niêm yết: <span className="line-through decoration-[1.5px] text-gray-800 font-bold">{formatCurrency(product.originalPrice)}đ</span></span>
                ) : <span>&nbsp;</span>}
              </div>
            </div>
          </div>

          {/* Hàng dưới: Barcode to rõ sát góc dưới + Gạch ngang & Thời gian áp dụng */}
          <div className="w-full flex items-end justify-between mt-auto pt-1">
            {/* Barcode to hơn (rộng 42mm, cao 42px) */}
            <div className="shrink-0" style={{ width: '42mm', height: '42px' }}>
              <BarcodeImage barcode={product.barcode} className="h-full w-full object-contain object-left-bottom" scale={4} bcHeight={22} textsize={13} />
            </div>

            {/* Gạch ngang & Thời gian áp dụng */}
            <div className="flex flex-col items-end justify-end flex-1 pl-1.5 pb-0.5">
              <div className="w-full border-t-[1.5px] border-black mb-1"></div>
              <div className="text-center font-bold text-black whitespace-nowrap overflow-hidden text-ellipsis w-full" style={{ fontSize: '8.5px', lineHeight: '1.2' }}>
                <span className="text-gray-700 font-medium" style={{ fontSize: '8px' }}>Áp dụng: </span>
                <span>{product.dateRange ? formatDateRangeShort(product.dateRange) : '01/10 - 31/10'}</span>
                {product.unit ? (
                  <span className="font-black ml-1 text-black" style={{ fontSize: '9.5px' }}>
                    {String(product.unit).startsWith('/') ? product.unit : `/${product.unit}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // 6. Tem Combo In Ngang (100x80) theo đúng bố cục mẫu SpecialPromo bo góc có thêm BIG SALE to
  const TemplateCombo80x100 = ({ product }) => {
    const promoInfo = getPromoContentInfo(product.promoContent, '100x80');

    return (
      <div className="w-full h-full bg-white flex flex-col p-4 box-border relative text-black select-none" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
        <div className="w-full h-full border-[6px] rounded-[28px] border-black p-6 flex flex-col relative overflow-hidden justify-between">
          
          {/* Header: BIG SALE Badge to nổi bật + Tên sản phẩm */}
          <div className="flex flex-col items-center shrink-0">
            {/* Khung đen chữ trắng BIG SALE to */}
            <div className="bg-black text-white px-12 py-2 rounded-[10px] flex items-center justify-center gap-3 mb-2.5 shadow-sm shrink-0">
              <span className="text-[26px] leading-none select-none text-white">★</span>
              <span 
                className="text-[48px] uppercase italic leading-none text-white font-bold" 
                style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif", letterSpacing: '0.15em' }}
              >
                BIG SALE
              </span>
              <span className="text-[26px] leading-none select-none text-white">★</span>
            </div>

            {/* Tên sản phẩm */}
            <div 
              className="text-center text-black text-[32px] leading-tight line-clamp-2 px-4 font-bold"
              style={{ 
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif"
              }}
            >
              {product.name}
            </div>
          </div>

          {/* Vạch kẻ ngang ngăn cách Header và Nội dung CTKM */}
          <div className="w-full h-[4px] bg-black rounded-full shrink-0 my-2"></div>

          {/* Nội dung chương trình khuyến mãi (Hero Center) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center w-full overflow-hidden px-6 py-2 my-auto">
            <div 
              className="text-black text-center w-full max-w-full tracking-wide"
              style={promoInfo.style}
            >
              {promoInfo.text}
            </div>
          </div>

          {/* Chân tem: Mã vạch | Ngày áp dụng */}
          <div className="flex justify-between items-end w-full px-2 mt-auto shrink-0 whitespace-nowrap overflow-hidden pb-1 font-bold" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
            <div 
              className="text-black"
              style={{ fontSize: '26px' }}
            >
              {product.barcode}
            </div>
            <div 
              className="text-black mx-2"
              style={{ fontSize: '26px' }}
            >
              |
            </div>
            <div 
              className="text-black"
              style={{ fontSize: '26px' }}
            >
              {product.dateRange ? `Áp dụng: ${formatDateRangeShort(product.dateRange)}` : 'Áp dụng: Liên hệ'}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const getPromoContentInfo = (rawContent, size) => {
    // Tự động chuẩn hóa dấu xuống dòng và khoảng trắng
    const formatted = String(rawContent || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .replace(/([,;])([^\s])/g, '$1 $2')
      .trim();
    const len = formatted.length;
    
    let fontSize = 50;
    let lineHeight = 1.35;

    if (size === 'A6') {
      // Khổ A6 dọc (1000px x 1414px), vùng nội dung rộng ~850px, cao ~950px
      if (len <= 35) {
        fontSize = 105;
        lineHeight = 1.3;
      } else if (len <= 65) {
        fontSize = 88;
        lineHeight = 1.32;
      } else if (len <= 100) {
        fontSize = 75;
        lineHeight = 1.35;
      } else if (len <= 140) {
        fontSize = 64;
        lineHeight = 1.38;
      } else if (len <= 190) {
        fontSize = 54;
        lineHeight = 1.4;
      } else {
        fontSize = 44;
        lineHeight = 1.38;
      }
    } else if (size === '100x80') {
      // Khổ Ngang 100x80 (1000px x 800px), vùng nội dung rộng ~880px, cao ~450px
      if (len <= 30) {
        fontSize = 75;
        lineHeight = 1.25;
      } else if (len <= 55) {
        fontSize = 62;
        lineHeight = 1.28;
      } else if (len <= 90) {
        fontSize = 50;
        lineHeight = 1.3;
      } else if (len <= 140) {
        fontSize = 42;
        lineHeight = 1.32;
      } else if (len <= 190) {
        fontSize = 36;
        lineHeight = 1.32;
      } else {
        fontSize = 30;
        lineHeight = 1.3;
      }
    } else {
      // Khổ A5 & A7 ngang (1000px x 707px), vùng nội dung rộng ~850px, cao ~420px
      if (len <= 30) {
        fontSize = 68;
        lineHeight = 1.25;
      } else if (len <= 55) {
        fontSize = 55;
        lineHeight = 1.28;
      } else if (len <= 90) {
        fontSize = 46;
        lineHeight = 1.3;
      } else if (len <= 140) {
        fontSize = 38;
        lineHeight = 1.32;
      } else if (len <= 190) {
        fontSize = 32;
        lineHeight = 1.32;
      } else {
        fontSize = 26;
        lineHeight = 1.3;
      }
    }

    return {
      text: formatted,
      style: {
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'pre-line',
        fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif",
        fontWeight: 'bold'
      }
    };
  };

  const TemplateSpecialPromo = ({ product }) => {
    const isA6 = promoSize === 'A6';
    const promoInfo = getPromoContentInfo(product.promoContent, promoSize);

    return (
      <div className="w-full h-full bg-white flex flex-col p-4 box-border relative select-none" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
        <div className={`w-full h-full ${isA6 ? 'border-[8px] rounded-[40px] p-8' : 'border-[6px] rounded-[28px] p-6'} border-black flex flex-col relative overflow-hidden justify-between`}>
            
            {/* Header: BIG SALE Badge to + Tên sản phẩm */}
            <div className={`flex flex-col items-center shrink-0 ${isA6 ? 'mb-4 mt-2' : 'mb-1 mt-0.5'}`}>
              <div className={`bg-black text-white ${isA6 ? 'px-16 py-3 rounded-[14px] gap-4 mb-4' : 'px-12 py-2 rounded-[10px] gap-3 mb-2.5'} flex items-center justify-center shadow-sm shrink-0`}>
                <span className={`${isA6 ? 'text-[36px]' : 'text-[26px]'} leading-none select-none text-white`}>★</span>
                <span 
                  className={`${isA6 ? 'text-[64px]' : 'text-[46px]'} uppercase italic leading-none font-bold`}
                  style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif", letterSpacing: '0.15em' }}
                >
                  BIG SALE
                </span>
                <span className={`${isA6 ? 'text-[36px]' : 'text-[26px]'} leading-none select-none text-white`}>★</span>
              </div>

              <div 
                className={`text-center text-black leading-tight line-clamp-2 px-6 font-bold`}
                style={{ 
                  fontSize: isA6 ? '46px' : '30px',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif"
                }}
              >
                {product.name}
              </div>
            </div>
            
            {/* Divider */}
            <div className={`w-full ${isA6 ? 'h-[6px] mb-4' : 'h-[4px] my-2'} bg-black rounded-full shrink-0`}></div>
            
            {/* Promo Content Body */}
            <div className={`flex-1 flex flex-col items-center justify-center text-center w-full overflow-hidden ${isA6 ? 'px-8 py-4' : 'px-6 py-2'} my-auto`}>
              <div 
                className="text-black text-center w-full max-w-full tracking-wide"
                style={promoInfo.style}
              >
                {promoInfo.text}
              </div>
            </div>
            
            {/* Bottom Section */}
            <div className={`flex justify-between items-end w-full px-2 mt-auto shrink-0 whitespace-nowrap overflow-hidden pb-1 font-bold`} style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
               <div 
                 className="text-black"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  {product.barcode}
               </div>
               <div 
                 className="text-black mx-2"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  |
               </div>
               <div 
                 className="text-black"
                 style={{ fontSize: isA6 ? '34px' : '26px' }}
               >
                  {product.dateRange ? `Áp dụng: ${formatDateRangeShort(product.dateRange)}` : 'Áp dụng: Liên hệ'}
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
      else if (selectedTemplate === 'sale_60x70') TemplateComponent = TemplateSale60x70;
      else if (selectedTemplate === 'sale_50x80') TemplateComponent = TemplateSale50x80;
      else if (selectedTemplate === 'sale_80x50') TemplateComponent = TemplateSale80x50;
  } else {
      if (promoSize === '100x80') {
          TemplateComponent = TemplateCombo80x100;
      } else {
          TemplateComponent = TemplateSpecialPromo;
      }
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 font-sans select-none">
        <div className="w-12 h-12 border-4 border-[#E0376F] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[#10285B] font-bold text-base tracking-wide">Đang khởi động Xưởng in tem...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
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
                    <>
                      <div className="grid grid-cols-2 gap-2">
                          {[
                              { id: 'normal', label: 'Niêm yết (60x35)', type: 'Niêm yết' },
                              { id: 'normal_usp', label: 'Niêm yết USP (80x70)', type: 'Niêm yết' },
                              { id: 'normal_small', label: 'Niêm yết Nhỏ (50x24)', type: 'Niêm yết' },
                              { id: 'sale', label: 'Sale Thường (60x35)', type: 'Discount' },
                              { id: 'sale_80x50', label: 'Sale Thường (80x50 - 10 tem/trang)', type: 'Discount' },
                              { id: 'sale_usp', label: 'Sale USP (80x70 - 8 tem/trang)', type: 'Discount' },
                              { id: 'sale_60x70', label: 'Sale Đứng (60x70 - 12 tem/trang)', type: 'Discount' },
                              { id: 'sale_50x80', label: 'Sale Đứng (50x80 - 12 tem/trang)', type: 'Discount' }
                          ].filter(tpl => tpl.type === promoType).map(tpl => (
                              <button
                                  key={tpl.id}
                                  onClick={() => setSelectedTemplate(tpl.id)}
                                  className={`py-1.5 px-1 rounded-md border text-xs font-medium transition-all ${
                                      selectedTemplate === tpl.id
                                      ? 'border-[#E0376F] bg-pink-50 text-[#E0376F] font-bold shadow-sm' 
                                      : 'border-gray-200 text-gray-600 hover:bg-white'
                                  }`}
                              >
                                  {tpl.label}
                              </button>
                          ))}
                      </div>

                      {selectedTemplate === 'sale_60x70' && (
                        <div className="mt-2.5 px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-900 leading-snug">
                          <div className="font-bold text-[#10285B] mb-1">
                            🎯 Sale Đứng Chuẩn (60 x 70 mm - 12 tem / trang):
                          </div>
                          <div className="text-gray-700 space-y-0.5">
                            <div>• Kích thước in chuẩn 100% đúng <b>60 mm x 70 mm</b> (3 cột x 4 hàng = 12 tem).</div>
                            <div>• Căn đều khổ A4 chuẩn xác, không bị co nhỏ hay thừa lề trắng.</div>
                            <div>• Trong hộp thoại in chọn: <b>Lề (Margins): "Không có" (None)</b> & <b>Tỷ lệ (Scale): 100%</b>.</div>
                          </div>
                        </div>
                      )}

                      {selectedTemplate === 'sale_50x80' && (
                        <div className="mt-2.5 px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-900 leading-snug">
                          <div className="font-bold text-[#10285B] mb-1">
                            🎯 Sale Đứng Chuẩn (50 x 80 mm - 12 tem / trang):
                          </div>
                          <div className="text-gray-700 space-y-0.5">
                            <div>• Kích thước in chuẩn 100% đúng <b>50 mm x 80 mm</b> (4 cột x 3 hàng = 12 tem).</div>
                            <div>• Căn giữa trang A4 chuẩn xác, tự động dàn đều lề các phía.</div>
                            <div>• Trong hộp thoại in chọn: <b>Lề (Margins): "Không có" (None)</b> & <b>Tỷ lệ (Scale): 100%</b>.</div>
                          </div>
                        </div>
                      )}

                      {selectedTemplate === 'sale_80x50' && (
                        <div className="mt-2.5 px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-900 leading-snug">
                          <div className="font-bold text-[#10285B] mb-1">
                            🎯 Sale Thường Chuẩn (80 x 50 mm - 10 tem / trang):
                          </div>
                          <div className="text-gray-700 space-y-0.5">
                            <div>• Kích thước in chuẩn 100% đúng <b>80 mm x 50 mm</b> (2 cột x 5 hàng = 10 tem).</div>
                            <div>• Căn giữa trang A4 chuẩn xác, tự động dàn đều lề các phía.</div>
                            <div>• Trong hộp thoại in chọn: <b>Lề (Margins): "Không có" (None)</b> & <b>Tỷ lệ (Scale): 100%</b>.</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Chọn kích thước tem:</label>
                      <select 
                        value={promoSize} 
                        onChange={e => setPromoSize(e.target.value)}
                        className="w-full border border-[#E0376F] rounded p-2 text-sm bg-pink-50 font-bold text-[#E0376F] outline-none"
                      >
                        <option value="100x80">Khổ Ngang 100 x 80 mm (6 tem / trang)</option>
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
                    {isBarcodeNeeded && totalBarcodesCount > 0 && (
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
                    <div className="flex items-center gap-1.5">
                        <label className="text-gray-500 hidden sm:block">Khổ giấy:</label>
                        <span className="text-[#10285B] font-bold">A4 (Dọc)</span>
                        {selectedTemplate === 'sale_60x70' ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-pink-800 bg-pink-50 border border-pink-300 px-2 py-0.5 rounded ml-2 font-semibold">
                            🎯 Mẫu chuẩn 60x70mm (12 tem) | Trong hộp thoại in chọn <b>Lề: Không có (None)</b> & <b>Tỷ lệ: 100%</b>
                          </span>
                        ) : selectedTemplate === 'sale_50x80' ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-pink-800 bg-pink-50 border border-pink-300 px-2 py-0.5 rounded ml-2 font-semibold">
                            🎯 Mẫu chuẩn 50x80mm (12 tem) | Trong hộp thoại in chọn <b>Lề: Không có (None)</b> & <b>Tỷ lệ: 100%</b>
                          </span>
                        ) : selectedTemplate === 'sale_80x50' ? (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-pink-800 bg-pink-50 border border-pink-300 px-2 py-0.5 rounded ml-2 font-semibold">
                            🎯 Mẫu chuẩn 80x50mm (10 tem) | Trong hộp thoại in chọn <b>Lề: Không có (None)</b> & <b>Tỷ lệ: 100%</b>
                          </span>
                        ) : (
                          <span className="hidden lg:inline-block text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded ml-2">
                            💡 Mẹo in: Chọn <b>Margins: "None" (Không có)</b> để tem không bị co nhỏ
                          </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (products.length === 0) return;
                            if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm trong danh sách in không?")) {
                                setProducts([]);
                            }
                        }} 
                        disabled={products.length === 0}
                        className={`flex items-center gap-1 border-r border-gray-200 pr-4 transition-colors ${
                            products.length === 0 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-500 hover:text-[#E0376F] cursor-pointer'
                        }`}
                        title={products.length === 0 ? 'Danh sách trống' : 'Xóa toàn bộ sản phẩm chờ in'}
                    >
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
                            // Ghi nhận log tracking sự kiện in tem
                            fetch('/api/tracking/action', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'PRINT_TEM',
                                details: {
                                  template: selectedTemplate,
                                  tagCount: totalTags,
                                  store: selectedStore || 'Toàn hệ thống',
                                  promoType: promoType
                                }
                              })
                            }).catch(err => console.error('Lỗi tracking print:', err));

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

                    {/* Góc thông tin tài khoản Lark & Nút Thống kê (Chỉ Admin mới có) */}
                    {currentUser && (
                      <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
                        {currentUser.isAdmin && (
                          <button
                            onClick={() => setShowStatsModal(true)}
                            title="Xem thống kê lượt truy cập & in ấn của nhân viên (Chỉ Admin)"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-colors text-xs border border-slate-200"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            <span className="hidden sm:inline">Thống kê</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <img
                            src={currentUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                            className="w-7 h-7 rounded-full border border-gray-200 object-cover shadow-sm"
                            alt=""
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800 hidden md:inline max-w-[120px] truncate" title={currentUser.name}>
                              {currentUser.name}
                            </span>
                            {currentUser.isAdmin && (
                              <span className="text-[10px] font-semibold text-purple-600 hidden md:inline -mt-0.5">
                                👑 Quản trị viên
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleLogout}
                          title="Đăng xuất khỏi hệ thống"
                          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                      </div>
                    )}
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
                            className={`page-container ${
                              selectedTemplate === 'sale_60x70' ? 'page-sale_60x70' : 
                              selectedTemplate === 'sale_50x80' ? 'page-sale_50x80' : 
                              selectedTemplate === 'sale_80x50' ? 'page-sale_80x50' : ''
                            } bg-white shadow-md print:shadow-none shrink-0 relative box-border overflow-hidden mx-auto`}
                            style={selectedTemplate === 'sale_60x70' ? {
                                width: '210mm',
                                height: '297mm',
                                padding: '8.5mm 15mm',
                                boxSizing: 'border-box'
                            } : selectedTemplate === 'sale_50x80' ? {
                                width: '210mm',
                                height: '297mm',
                                padding: '28.5mm 5mm',
                                boxSizing: 'border-box'
                            } : selectedTemplate === 'sale_80x50' ? {
                                width: '210mm',
                                height: '297mm',
                                padding: '22.4mm 24.7mm',
                                boxSizing: 'border-box'
                            } : {
                                width: `${currentPaper.w}px`,
                                height: `${currentPaper.h}px`,
                                paddingTop: `${padTop}px`,
                                paddingBottom: `${padBottom}px`,
                                paddingLeft: `${padLeft}px`,
                                paddingRight: `${padRight}px`
                            }}
                        >
                            <div 
                                className={
                                    selectedTemplate === 'sale_60x70' ? 'grid-sale_60x70' : 
                                    selectedTemplate === 'sale_50x80' ? 'grid-sale_50x80' : 
                                    selectedTemplate === 'sale_80x50' ? 'grid-sale_80x50' : ''
                                }
                                style={selectedTemplate === 'sale_60x70' ? {
                                    display: 'grid',
                                    gridTemplateColumns: '60mm 60mm 60mm',
                                    gridTemplateRows: '70mm 70mm 70mm 70mm',
                                    width: '180mm',
                                    height: '280mm',
                                    gap: '0px',
                                    margin: '0',
                                    padding: '0',
                                    boxSizing: 'border-box'
                                } : selectedTemplate === 'sale_50x80' ? {
                                    display: 'grid',
                                    gridTemplateColumns: '50mm 50mm 50mm 50mm',
                                    gridTemplateRows: '80mm 80mm 80mm',
                                    width: '200mm',
                                    height: '240mm',
                                    gap: '0px',
                                    margin: '0',
                                    padding: '0',
                                    boxSizing: 'border-box'
                                } : selectedTemplate === 'sale_80x50' ? {
                                    display: 'grid',
                                    gridTemplateColumns: '80mm 80mm',
                                    gridTemplateRows: '50mm 50mm 50mm 50mm 50mm',
                                    width: '160.6mm',
                                    height: '252.2mm',
                                    gap: '2px',
                                    margin: '0',
                                    padding: '0',
                                    boxSizing: 'border-box'
                                } : {
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${tagsPerRow}, ${scaledTagWidth}px)`,
                                    gap: `${tagGap}px`,
                                    justifyContent: 'center',
                                    alignContent: 'start'
                                }}
                            >
                                 {page.map(tag => {
                                     const tagBarcode = String(tag.barcode || '').trim();
                                     const isTagReady = !isBarcodeNeeded || !tagBarcode || loadedBarcodes.has(tagBarcode);
                                     return (
                                         <div 
                                             key={tag.renderId} 
                                             className={`tag-wrapper ${
                                               selectedTemplate === 'sale_60x70' ? 'tag-sale_60x70' : 
                                               selectedTemplate === 'sale_50x80' ? 'tag-sale_50x80' : 
                                               selectedTemplate === 'sale_80x50' ? 'tag-sale_80x50' : ''
                                             } relative break-inside-avoid origin-top-left overflow-hidden`} 
                                             style={selectedTemplate === 'sale_60x70' ? { 
                                                 width: '60mm', 
                                                 height: '70mm',
                                                 boxSizing: 'border-box',
                                                 breakInside: 'avoid', 
                                                 pageBreakInside: 'avoid' 
                                             } : selectedTemplate === 'sale_50x80' ? { 
                                                 width: '50mm', 
                                                 height: '80mm',
                                                 boxSizing: 'border-box',
                                                 breakInside: 'avoid', 
                                                 pageBreakInside: 'avoid' 
                                             } : selectedTemplate === 'sale_80x50' ? { 
                                                 width: '80mm', 
                                                 height: '50mm',
                                                 boxSizing: 'border-box',
                                                 breakInside: 'avoid', 
                                                 pageBreakInside: 'avoid' 
                                             } : { 
                                                 width: `${scaledTagWidth}px`, 
                                                 height: `${scaledTagHeight}px`,
                                                 breakInside: 'avoid', 
                                                 pageBreakInside: 'avoid' 
                                             }}
                                         >
                                             {['sale_60x70', 'sale_50x80', 'sale_80x50'].includes(selectedTemplate) ? (
                                                 isTagReady ? (
                                                     <TemplateComponent product={tag} />
                                                 ) : (
                                                     <div className="w-full h-full bg-white border border-dashed border-gray-300 rounded-[8px] flex flex-col items-center justify-center p-2 text-center select-none print:hidden">
                                                         <div className="w-6 h-6 border-2 border-[#E0376F] border-t-transparent rounded-full animate-spin mb-2"></div>
                                                         <div className="font-bold text-xs text-[#10285B] line-clamp-1 px-1">{tag.name}</div>
                                                         <div className="text-[10px] text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-0.5 rounded">Đang nạp: {tag.barcode}</div>
                                                     </div>
                                                 )
                                             ) : (
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
                                             )}
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
            size: A4 portrait; 
            margin: 0; 
          }
          @media print {
            /* TRIỆT TIÊU HOÀN TOÀN AUTO-SHRINK CỦA CHROME DO ĐỘ RỘNG MÀN HÌNH */
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
              width: 210mm !important;
              max-width: 210mm !important;
              height: auto !important;
              overflow: visible !important;
            }
            #root, #root > div, .h-screen, [class*='h-screen'] {
              width: 210mm !important;
              max-width: 210mm !important;
              min-width: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
              position: static !important;
              float: none !important;
              overflow: visible !important;
              background: white !important;
            }
            .print\\:hidden, [class*='print:hidden'], header, nav, aside { 
              display: none !important; 
            }
            .print-viewport { 
              position: static !important; 
              left: auto !important; 
              top: auto !important; 
              width: 210mm !important; 
              max-width: 210mm !important;
              min-width: 0 !important;
              height: auto !important; 
              padding: 0 !important; 
              margin: 0 !important; 
              background-color: white !important; 
              display: block !important;
              overflow: visible !important;
            }
            .print-viewport > div:not([class*='print:hidden']) {
              display: block !important;
              width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .page-container { 
                page-break-after: always !important; 
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 auto !important; 
                box-shadow: none !important; 
                border: none !important; 
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                background-color: white !important;
            }
            /* Khổ Sale Đứng Chuẩn (60x70 - 12 tem / A4) */
            .page-sale_60x70 {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                padding: 8.5mm 15mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .grid-sale_60x70 {
                display: grid !important;
                grid-template-columns: 60mm 60mm 60mm !important;
                grid-template-rows: 70mm 70mm 70mm 70mm !important;
                width: 180mm !important;
                height: 280mm !important;
                gap: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            .tag-sale_60x70 {
                width: 60mm !important;
                height: 70mm !important;
                min-width: 60mm !important;
                min-height: 70mm !important;
                max-width: 60mm !important;
                max-height: 70mm !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
            }
            /* Khổ Sale Đứng Chuẩn (50x80 - 12 tem / A4) */
            .page-sale_50x80 {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                padding: 28.5mm 5mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .grid-sale_50x80 {
                display: grid !important;
                grid-template-columns: 50mm 50mm 50mm 50mm !important;
                grid-template-rows: 80mm 80mm 80mm !important;
                width: 200mm !important;
                height: 240mm !important;
                gap: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            .tag-sale_50x80 {
                width: 50mm !important;
                height: 80mm !important;
                min-width: 50mm !important;
                min-height: 80mm !important;
                max-width: 50mm !important;
                max-height: 80mm !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
            }
            /* Khổ Sale Thường Chuẩn (80x50 - 10 tem / A4) */
            .page-sale_80x50 {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                padding: 22.4mm 24.7mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .grid-sale_80x50 {
                display: grid !important;
                grid-template-columns: 80mm 80mm !important;
                grid-template-rows: 50mm 50mm 50mm 50mm 50mm !important;
                width: 160.6mm !important;
                height: 252.2mm !important;
                gap: 2px !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            .tag-sale_80x50 {
                width: 80mm !important;
                height: 50mm !important;
                min-width: 80mm !important;
                min-height: 50mm !important;
                max-width: 80mm !important;
                max-height: 50mm !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
            }
            /* Kích thước vector 100% mm không cần div scale */
            .page-container:last-child { page-break-after: auto !important; break-after: auto !important; }
            .tag-wrapper { page-break-inside: avoid !important; break-inside: avoid !important; display: inline-block; }
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

        {/* Modal Thống kê Tracking */}
        <StatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />
    </div>
  );
}

ReactDOM.render(<ErrorBoundary><App /></ErrorBoundary>, document.getElementById('root'));
