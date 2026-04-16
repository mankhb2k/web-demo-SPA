import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Server,
  Database,
  Cpu,
  Play,
  Square,
  Trash2,
  UserPlus,
  Activity,
  HardDrive,
  Info,
  Terminal,
  Zap,
  Moon,
  Layers,
  ShieldCheck,
  ZapOff,
} from "lucide-react";

const DOCKER_IMAGE_NAME = "openclaw-core:v1.2-pro";

const App = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([
    {
      time: new Date().toLocaleTimeString(),
      msg: "Hệ thống Orchestrator khởi động...",
    },
  ]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const addLog = (msg) => {
    setLogs((prev) =>
      [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 10),
    );
  };

  const registerUser = () => {
    const userId = "user_" + Math.random().toString(36).substr(2, 4);
    const newUser = {
      id: userId,
      status: "provisioning",
      memory: 0,
      cpu: 0,
      volumePath: `/mnt/data/${userId}/`,
      port: Math.floor(Math.random() * (9000 - 8000) + 8000),
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    addLog(`Yêu cầu tạo container mới cho ${userId}...`);

    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: "running", memory: 160, cpu: 4 }
            : u,
        ),
      );
      addLog(`Container [${userId}] đã cô lập tài nguyên thành công.`);
    }, 1200);
  };

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const isRunning = u.status === "running";
          addLog(
            isRunning
              ? `Dừng ${id}: Giải phóng RAM`
              : `Đánh thức ${id}: Nạp lại SQLite`,
          );
          return {
            ...u,
            status: isRunning ? "stopped" : "running",
            memory: isRunning ? 0 : 160,
            cpu: isRunning ? 0 : 4,
          };
        }
        return u;
      }),
    );
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addLog(`Đã xóa container và dọn dẹp volume của ${id}`);
  };

  const totalMemory = users.reduce((acc, u) => acc + u.memory, 0);
  const totalCPU = users.reduce((acc, u) => acc + u.cpu, 0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Layers className="text-blue-500" /> OpenClaw SaaS Core
          </h1>
          <p className="text-slate-400 mt-1">
            Kiến trúc:{" "}
            <span className="text-blue-400 font-mono">
              1-User-per-Container
            </span>{" "}
            (Isolation Mode)
          </p>
        </div>
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          {["dashboard", "storage", "compare"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              {tab === "dashboard"
                ? "Quản lý"
                : tab === "storage"
                  ? "Dữ liệu"
                  : "So sánh"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Server size={16} /> Tài nguyên VPS (Real-time)
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">
                    RAM Sử dụng (Hạn mức 4GB)
                  </span>
                  <span className="font-mono">{totalMemory} MB / 4096 MB</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-700 ${totalMemory > 3000 ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${(totalMemory / 4096) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-500 uppercase">
                    Containers
                  </div>
                  <div className="text-xl font-bold text-white">
                    {users.length}
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-500 uppercase">
                    Trạng thái CPU
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    {totalCPU}%
                  </div>
                </div>
              </div>

              <button
                onClick={registerUser}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <UserPlus size={20} /> Tạo User & Container mới
              </button>
            </div>
          </div>

          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
            <h2 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={16} /> Sự kiện hệ thống
            </h2>
            <div className="font-mono text-[11px] h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${i === 0 ? "text-blue-400" : "text-slate-500"}`}
                >
                  <span className="opacity-30">{log.time}</span>
                  <span className="flex-1">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.length === 0 ? (
                <div className="col-span-full h-80 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 bg-slate-800/10">
                  <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                    <Box size={40} className="opacity-20" />
                  </div>
                  <p className="font-medium text-lg">Hệ thống đang trống</p>
                  <p className="text-sm opacity-60">
                    Hãy bắt đầu bằng việc thêm người dùng đầu tiên.
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="group bg-slate-800/60 border border-slate-700 p-5 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden"
                  >
                    {user.status === "running" && (
                      <div className="absolute top-0 right-0 p-2">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.status === "running" ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-500"}`}
                        >
                          <Box size={24} />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-mono">
                            {user.id}
                          </div>
                          <div className="font-bold text-white">
                            OpenClaw Bot Instance
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                        >
                          {user.status === "running" ? (
                            <Moon size={18} />
                          ) : (
                            <Zap size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                            Bộ nhớ khả dụng
                          </div>
                          <div className="text-sm font-mono text-slate-300">
                            {user.memory} MB / 256 MB
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.status === "running" ? "bg-green-500/10 text-green-400" : "bg-slate-900 text-slate-600"}`}
                        >
                          {user.status}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${(user.memory / 256) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <Database size={12} className="text-slate-500" />
                        <span className="text-[10px] font-mono text-slate-400 truncate flex-1">
                          {user.volumePath}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "storage" && (
            <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 min-h-[500px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                  <HardDrive size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Persistent Storage
                  </h2>
                  <p className="text-sm text-slate-400">
                    Dữ liệu được tách biệt hoàn toàn trên ổ đĩa Host
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 font-mono text-xs space-y-4">
                  <div className="text-slate-500 italic pb-2 border-b border-slate-800">
                    /mnt/data/ (Host Drive)
                  </div>
                  {users.length === 0 ? (
                    <div className="text-slate-700">Trống...</div>
                  ) : (
                    users.map((u) => (
                      <div key={u.id} className="space-y-1">
                        <div className="text-blue-400 flex items-center gap-2">
                          📁 {u.id}/
                        </div>
                        <div className="pl-6 text-slate-500">
                          ├── 📄 openclaw.db{" "}
                          <span className="text-[10px] text-slate-700">
                            (SQLite - Dữ liệu chat)
                          </span>
                        </div>
                        <div className="pl-6 text-slate-500">
                          ├── 📄 config.json{" "}
                          <span className="text-[10px] text-slate-700">
                            (Bot tokens)
                          </span>
                        </div>
                        <div className="pl-6 text-slate-500">└── 📁 logs/</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-slate-400">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <h4 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                      <ShieldCheck size={16} /> Lợi ích của 1-User-1-DB
                    </h4>
                    <p>
                      Khi User A xóa tài khoản, bạn chỉ cần xóa thư mục tương
                      ứng. Không lo ảnh hưởng đến "Index" hay làm chậm database
                      chung của cả hệ thống.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <h4 className="text-amber-300 font-bold mb-2 flex items-center gap-2">
                      <ZapOff size={16} /> Chiến lược Offline
                    </h4>
                    <p>
                      Dù container bị dừng (Sleep), file .db vẫn nằm đó. Khi
                      user quay lại, container khởi động lại và "mount" lại đúng
                      file này. Không mất dữ liệu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "compare" && (
            <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-6">
                So sánh mô hình triển khai
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-4 font-bold text-slate-400">
                        Tiêu chí
                      </th>
                      <th className="pb-4 font-bold text-blue-400 text-center">
                        1-User-per-Container (Chọn)
                      </th>
                      <th className="pb-4 font-bold text-slate-500 text-center">
                        Shared Instance (Tránh)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr>
                      <td className="py-4 text-slate-300">
                        Bảo mật (Data Leak)
                      </td>
                      <td className="py-4 text-center text-green-400 italic">
                        Rất Cao (Bản chất Docker)
                      </td>
                      <td className="py-4 text-center text-red-400 italic">
                        Thấp (Dễ bug code leak data)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 text-slate-300">Giới hạn RAM/CPU</td>
                      <td className="py-4 text-center text-green-400 italic">
                        Dễ (Cấu hình Docker)
                      </td>
                      <td className="py-4 text-center text-red-400 italic">
                        Khó (Phải code logic phức tạp)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 text-slate-300">Chi phí RAM nền</td>
                      <td className="py-4 text-center text-amber-400 italic">
                        Trung bình (~20MB/Container)
                      </td>
                      <td className="py-4 text-center text-green-400 italic">
                        Thấp (Chỉ 1 ứng dụng)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 text-slate-300">Cập nhật (Update)</td>
                      <td className="py-4 text-center text-green-400 italic">
                        Linh hoạt từng user
                      </td>
                      <td className="py-4 text-center text-red-400 italic">
                        Bảo trì toàn hệ thống
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-8 p-4 bg-slate-900 rounded-xl text-xs text-slate-500 leading-relaxed italic border-l-4 border-blue-500">
                Lưu ý: Mặc dù chi phí RAM nền cho mỗi container hơi cao hơn,
                nhưng với **Alpine Linux** và nén image tối ưu, mỗi bot OpenClaw
                chỉ tốn khoảng 40-80MB RAM thực tế khi chạy nền. Với một VPS
                8GB, bạn có thể cân được ~100-150 user online cùng lúc dễ dàng.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
