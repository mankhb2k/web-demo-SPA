import React, { useState, useEffect } from "react";
import {
  Box,
  Server,
  Database,
  Cpu,
  Trash2,
  UserPlus,
  Activity,
  HardDrive,
  Info,
  Terminal,
  Zap,
  Moon,
  Layers,
  PlusCircle,
  ChevronRight,
  Package,
} from "lucide-react";

const DOCKER_IMAGE_NAME = "openclaw-core:v1.2";

const App = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "Docker Engine ready." },
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
      instances: [],
    };
    setUsers((prev) => [...prev, newUser]);
    addLog(`Đã tạo tài khoản khách hàng: ${userId}`);
    // Tự động tạo instance đầu tiên cho user
    addInstance(userId);
  };

  const addInstance = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const instanceId = `${userId}_bot_${u.instances.length + 1}`;
          addLog(
            `Đang khởi tạo Instance [${instanceId}] từ Image [${DOCKER_IMAGE_NAME}]`,
          );
          return {
            ...u,
            instances: [
              ...u.instances,
              {
                id: instanceId,
                status: "running",
                memory: 120,
                cpu: 2,
                type:
                  u.instances.length === 0
                    ? "Telegram"
                    : u.instances.length === 1
                      ? "Zalo"
                      : "WhatsApp",
              },
            ],
          };
        }
        return u;
      }),
    );
  };

  const toggleInstance = (userId, instanceId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            instances: u.instances.map((ins) => {
              if (ins.id === instanceId) {
                const isRunning = ins.status === "running";
                addLog(`${isRunning ? "Dừng" : "Chạy"} ${instanceId}`);
                return {
                  ...ins,
                  status: isRunning ? "stopped" : "running",
                  memory: isRunning ? 0 : 120,
                };
              }
              return ins;
            }),
          };
        }
        return u;
      }),
    );
  };

  const removeInstance = (userId, instanceId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          addLog(`Đã hủy instance ${instanceId}`);
          return {
            ...u,
            instances: u.instances.filter((ins) => ins.id !== instanceId),
          };
        }
        return u;
      }),
    );
  };

  const totalMemory = users.reduce(
    (acc, u) => acc + u.instances.reduce((sum, ins) => sum + ins.memory, 0),
    0,
  );
  const totalContainers = users.reduce((acc, u) => acc + u.instances.length, 0);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="text-blue-500" /> OpenClaw Multi-Instance SaaS
          </h1>
          <p className="text-slate-500 text-sm">
            Quản lý: 1 Image → Nhiều Containers → Một User
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-slate-500"}`}
          >
            HỆ THỐNG
          </button>
          <button
            onClick={() => setActiveTab("theory")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "theory" ? "bg-blue-600 text-white" : "text-slate-500"}`}
          >
            GIẢI THÍCH
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
              <Server size={14} /> Tài nguyên máy chủ
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>RAM ({totalMemory} MB / 8GB)</span>
                  <span
                    className={
                      totalMemory > 6000 ? "text-red-400" : "text-blue-400"
                    }
                  >
                    {((totalMemory / 8192) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${(totalMemory / 8192) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">
                    Containers
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {totalContainers}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">
                    Users
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {users.length}
                  </div>
                </div>
              </div>
              <button
                onClick={registerUser}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-900/20"
              >
                + Đăng ký User mới
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xs font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
              <Terminal size={14} /> Docker Events
            </h2>
            <div className="font-mono text-[10px] h-32 overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={i === 0 ? "text-blue-400" : "text-slate-600"}
                >
                  <span className="opacity-40">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Area */}
        <div className="lg:col-span-8">
          {activeTab === "dashboard" ? (
            <div className="space-y-6">
              {users.length === 0 ? (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 italic">
                  Chưa có khách hàng nào. Hãy nhấn tạo User mới.
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                          <Layers size={20} />
                        </div>
                        <div>
                          <div className="text-white font-bold">{user.id}</div>
                          <div className="text-[10px] text-slate-500">
                            Mã khách hàng
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addInstance(user.id)}
                        className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:bg-blue-400/10 px-3 py-2 rounded-lg transition"
                      >
                        <PlusCircle size={14} /> Thêm Instance (Bot)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {user.instances.map((ins) => (
                        <div
                          key={ins.id}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-xl group relative"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div
                                className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-1 ${ins.status === "running" ? "bg-green-500/10 text-green-500" : "bg-slate-800 text-slate-500"}`}
                              >
                                {ins.status.toUpperCase()}
                              </div>
                              <div className="text-xs font-mono text-slate-300">
                                {ins.id}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleInstance(user.id, ins.id)}
                                className="p-1.5 hover:bg-slate-800 rounded"
                              >
                                {ins.status === "running" ? (
                                  <Moon size={14} />
                                ) : (
                                  <Zap size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => removeInstance(user.id, ins.id)}
                                className="p-1.5 hover:bg-red-900/20 text-red-500/50 hover:text-red-500 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <ChevronRight size={12} /> Target:{" "}
                            <span className="text-blue-400 font-bold">
                              {ins.type}
                            </span>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-[10px] text-slate-600">
                              Image: {DOCKER_IMAGE_NAME}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ins.memory}MB RAM
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">
              <section>
                <h3 className="text-xl font-bold text-white mb-4">
                  Mối quan hệ 1-N trong Docker
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-blue-500 mb-2 flex justify-center">
                      <Package size={32} />
                    </div>
                    <div className="font-bold">1 Image</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Bản thiết kế duy nhất (Code OpenClaw)
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-slate-700">
                    <ChevronRight size={48} />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-green-500 mb-2 flex justify-center">
                      <Box size={32} />
                    </div>
                    <div className="font-bold">N Containers</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Nhiều thực thể chạy độc lập (Instances)
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-bold text-blue-400">
                  Tại sao không nên mang nhiều image vào 1 container?
                </h4>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3 text-sm leading-relaxed">
                  <p>
                    1. <strong>Vật lý:</strong> Docker Container được thiết kế
                    để cô lập một môi trường thực thi duy nhất. Nó không phải là
                    một "thư mục" chứa image khác.
                  </p>
                  <p>
                    2. <strong>Quản lý:</strong> Nếu bạn chạy 3 bot trong 1
                    container, khi 1 bot bị rò rỉ bộ nhớ (Memory Leak), nó sẽ
                    làm sập cả 2 bot còn lại của user đó.
                  </p>
                  <p>
                    3. <strong>Scaling:</strong> Nếu User A muốn nâng cấp gói
                    "VIP" cho riêng bot Telegram của họ nhưng giữ bot Zalo ở gói
                    "Free", việc tách container giúp bạn cấu hình giới hạn RAM
                    khác nhau cho từng instance cực kỳ dễ dàng.
                  </p>
                </div>
              </section>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-4">
                <Info className="text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-300 leading-relaxed">
                  <strong>Lời khuyên:</strong> Hãy tạo một giao diện trên Web
                  cho phép User nhấn nút "Tạo Bot mới". Mỗi lần họ nhấn, Backend
                  của bạn sẽ gọi lệnh <code>docker run</code> để tạo một
                  Container mới với một ID duy nhất gắn với user đó.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
