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
  ExternalLink,
} from "lucide-react";

const DOCKER_IMAGE_NAME = "openclaw-gateway:v1.0-alpine";

const App = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "Hệ thống Docker sẵn sàng." },
  ]);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | storage | concept

  const addLog = (msg) => {
    setLogs((prev) =>
      [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 10),
    );
  };

  const registerUser = () => {
    const userId = Math.random().toString(36).substr(2, 6);
    const newUser = {
      id: userId,
      status: "provisioning",
      memory: 0,
      cpu: 0,
      volumePath: `/data/users/${userId}/`,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    addLog(`Đang khởi tạo tài nguyên cho user: ${userId}...`);

    // Simulate provisioning
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: "running", memory: 128, cpu: 5 }
            : u,
        ),
      );
      addLog(`Container openclaw-${userId} đã chạy thành công.`);
    }, 1500);
  };

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const isRunning = u.status === "running";
          addLog(
            isRunning
              ? `Dừng container ${id} (Tiết kiệm RAM)`
              : `Khởi động container ${id} (Wake up)`,
          );
          return {
            ...u,
            status: isRunning ? "stopped" : "running",
            memory: isRunning ? 0 : 128,
            cpu: isRunning ? 0 : 5,
          };
        }
        return u;
      }),
    );
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addLog(`Đã hủy bỏ tài nguyên và xóa volume của user ${id}`);
  };

  const totalMemory = users.reduce((acc, u) => acc + u.memory, 0);
  const totalCPU = users.reduce((acc, u) => acc + u.cpu, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            OpenClaw SaaS Infrastructure
          </h1>
          <p className="text-slate-400">
            Trình mô phỏng quản lý Container theo từng người dùng
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "dashboard" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            Bảng điều khiển
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "storage" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            Lưu trữ (Volume)
          </button>
          <button
            onClick={() => setActiveTab("concept")}
            className={`px-4 py-2 rounded-lg transition ${activeTab === "concept" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            Kiến thức Docker
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Host Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-400">
              <Server size={20} /> Host Server (VPS)
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>RAM Usage (8GB Total)</span>
                  <span>{totalMemory} MB</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${(totalMemory / 8192) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Load (4 vCPU)</span>
                  <span>{totalCPU}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${totalCPU}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <Box size={16} /> Image đang dùng:{" "}
                  <code className="bg-slate-900 px-2 py-1 rounded">
                    {DOCKER_IMAGE_NAME}
                  </code>
                </div>
                <button
                  onClick={registerUser}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition transform active:scale-95"
                >
                  <UserPlus size={20} /> Đăng ký User mới
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-amber-400">
              <Terminal size={20} /> Logs (Docker Events)
            </h2>
            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs h-48 overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={i === 0 ? "text-blue-300" : "text-slate-500"}
                >
                  <span className="opacity-50">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.length === 0 ? (
                <div className="col-span-full h-64 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                  <Activity size={48} className="mb-4 opacity-20" />
                  <p>Chưa có container nào hoạt động.</p>
                  <p className="text-sm">Nhấn "Đăng ký User mới" để bắt đầu.</p>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${user.status === "running" ? "bg-green-500/20 text-green-400" : user.status === "stopped" ? "bg-slate-500/20 text-slate-400" : "bg-blue-500/20 text-blue-400 animate-pulse"}`}
                        >
                          <Box size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold uppercase tracking-wider text-sm">
                            User: {user.id}
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            Runtime: Linux Alpine
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                          title={
                            user.status === "running"
                              ? "Dừng bot (Sleep)"
                              : "Chạy bot (Wake up)"
                          }
                        >
                          {user.status === "running" ? (
                            <Moon size={18} />
                          ) : (
                            <Zap size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-300 transition"
                          title="Xóa tài nguyên"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 flex-grow">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Trạng thái:</span>
                        <span
                          className={
                            user.status === "running"
                              ? "text-green-400"
                              : "text-amber-400"
                          }
                        >
                          {user.status === "provisioning"
                            ? "Đang khởi tạo..."
                            : user.status === "running"
                              ? "● Đang chạy"
                              : "○ Đang ngủ (Idle)"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">RAM Limit:</span>
                        <span>256MB</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-2">
                        <div className="bg-slate-900 rounded py-1 border border-slate-700">
                          <div className="text-slate-500">Volume</div>
                          <div className="text-blue-400 truncate px-1">
                            /data/{user.id}
                          </div>
                        </div>
                        <div className="bg-slate-900 rounded py-1 border border-slate-700">
                          <div className="text-slate-500">Port</div>
                          <div className="text-blue-400">Internal: 3000</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "storage" && (
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-h-[400px]">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-cyan-400">
                <HardDrive size={20} /> Hệ thống Volume (Lưu trữ ngoài
                Container)
              </h2>
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-sm border border-slate-800">
                  <div className="text-slate-500 mb-2">
                    /data/users/ (Persistent Storage Root)
                  </div>
                  {users.length === 0 ? (
                    <div className="pl-4 text-slate-700 italic text-xs">
                      Thư mục trống...
                    </div>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        className="pl-4 border-l border-slate-800 ml-2 mb-4"
                      >
                        <div className="flex items-center gap-2 text-blue-400 py-1">
                          <Box size={14} /> {u.id}/
                        </div>
                        <div className="pl-6 space-y-1 text-slate-400 text-xs">
                          <div className="flex items-center gap-2 hover:text-green-400 cursor-pointer">
                            <Database size={12} /> openclaw.db{" "}
                            <span className="text-[10px] text-slate-600">
                              (SQLite)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info size={12} /> config.json{" "}
                            <span className="text-[10px] text-slate-600">
                              (Bot Tokens)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={12} /> gateway.log
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-sm text-blue-300">
                  <p className="font-bold flex items-center gap-2 mb-2">
                    <Info size={16} /> Tại sao cần Volume?
                  </p>
                  <p className="leading-relaxed">
                    Dữ liệu bên trong Container là "tạm thời" (ephemeral). Nếu
                    container bị xóa hoặc cập nhật phiên bản mới, dữ liệu sẽ
                    mất. Chúng ta dùng <strong>Docker Volume</strong> để "gắn"
                    một thư mục từ ổ cứng máy chủ vào bên trong container. Nhờ
                    đó, bot có thể dừng/chạy mà không mất lịch sử chat hay cấu
                    hình.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "concept" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Box size={18} /> Docker Image
                  </h3>
                  <p className="text-sm text-slate-400">
                    Nó giống như một tệp .ISO hoặc một file nén cài đặt. Nó chứa
                    toàn bộ code OpenClaw, các thư viện cần thiết. Image là{" "}
                    <strong>Read-only</strong> (chỉ đọc).
                  </p>
                </div>
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Zap size={18} /> Docker Container
                  </h3>
                  <p className="text-sm text-slate-400">
                    Khi "chạy" Image, ta có Container. Đây là "thực thể" thực sự
                    đang hoạt động. Với SaaS, mỗi User có 1 container riêng,
                    biệt lập hoàn toàn để bảo mật.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="font-bold text-slate-100 mb-4">
                  Quy trình SaaS (Mô phỏng code)
                </h3>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-sm overflow-x-auto whitespace-nowrap">
                  <div className="text-slate-500">
                    # Khi User nhấn "Active Bot" trên Web Dashboard
                  </div>
                  <div className="text-blue-300">docker run -d \</div>
                  <div className="text-blue-300">
                    {" "}
                    --name openclaw-user123 \
                  </div>
                  <div className="text-blue-300"> --memory="256m" \</div>
                  <div className="text-blue-300"> --cpus="0.5" \</div>
                  <div className="text-amber-300">
                    {" "}
                    -v /data/users/user123:/app/data \
                  </div>
                  <div className="text-blue-300"> -e USER_ID=user123 \</div>
                  <div className="text-blue-300"> openclaw-gateway:latest</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">✔</span>
                    <span>
                      <strong>Biệt lập (Isolation):</strong> User A không thể
                      đọc trộm file của User B.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">✔</span>
                    <span>
                      <strong>Giới hạn (Limits):</strong> Ngăn một user chiếm
                      hết RAM của server.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">✔</span>
                    <span>
                      <strong>Di động (Portability):</strong> Dễ dàng di chuyển
                      container sang server khác nếu server hiện tại đầy.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto mt-12 p-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-green-500" />
          Hệ thống đang mô phỏng trạng thái thời gian thực
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <Cpu size={14} /> Tối ưu: Alpine Linux
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={14} /> Storage: SQLite
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
