"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";

export default function ChildLoginPage() {
  const router = useRouter();
  const { children, selectChild } = useGameStore();

  const [selectedChildIndex, setSelectedChildIndex] = useState<number | null>(null);
  const [pinCode, setPinCode] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [error, setError] = useState("");

  // Auto-select child if there's only one and go directly to PIN input
  useEffect(() => {
    if (children.length === 1 && selectedChildIndex === null && !showPinInput) {
      setSelectedChildIndex(0);
      setShowPinInput(true);
    }
  }, [children, selectedChildIndex, showPinInput]);

  const handleChildSelect = (index: number) => {
    setSelectedChildIndex(index);
    setShowPinInput(true);
    setPinCode("");
    setError("");
  };

  const handlePinChange = (value: string) => {
    const numeric = value.replace(/\D/g, "").slice(0, 4);
    setPinCode(numeric);

    // Auto-submit when 4 digits entered
    if (numeric.length === 4) {
      verifyPin(numeric);
    }
  };

  const verifyPin = (pin: string) => {
    if (selectedChildIndex === null) return;

    const child = children[selectedChildIndex];

    // TODO: Verify PIN with Supabase
    // For now, accept any 4-digit PIN
    selectChild(child.id);
    router.push("/child/world");
  };

  const handleBack = () => {
    setShowPinInput(false);
    setPinCode("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-display font-bold gradient-text mb-4">
            英语冒险岛
          </h1>
          <p className="text-2xl text-gray-600">选择你的角色</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showPinInput ? (
            // Child Selection Screen
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {children.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-8 text-center shadow-xl"
                >
                  <div className="text-6xl mb-4">🏝️</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    还没有角色哦
                  </h2>
                  <p className="text-gray-600 mb-6">
                    请爸爸妈妈帮你创建一个角色
                  </p>
                  <button
                    onClick={() => router.push("/parent/login")}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                  >
                    去家长页面
                  </button>
                </motion.div>
              ) : (
                children.map((child, index) => (
                  <motion.button
                    key={child.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChildSelect(index)}
                    className="w-full bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex items-center gap-6"
                  >
                    <div className="text-6xl">{child.avatarUrl || "🧒"}</div>
                    <div className="text-left flex-1">
                      <h2 className="text-3xl font-bold text-gray-800 mb-1">
                        {child.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-xl text-gray-600">
                          {child.currentPoints} 积分
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl text-gray-400">→</div>
                  </motion.button>
                ))
              )}
            </motion.div>
          ) : (
            // PIN Entry Screen
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl"
            >
              {/* Selected child info */}
              <div className="text-center mb-8">
                <div className="text-7xl mb-4">
                  {children[selectedChildIndex!]?.avatarUrl || "🧒"}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {children[selectedChildIndex!]?.name}
                </h2>
                <p className="text-gray-600">请输入4位数字PIN码</p>
              </div>

              {/* PIN Display */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-16 h-20 rounded-2xl border-4 flex items-center justify-center text-3xl font-bold transition-all ${
                      pinCode[i]
                        ? "border-primary-500 bg-primary-50 text-primary-600"
                        : "border-gray-300 bg-gray-50"
                    }`}
                    animate={
                      pinCode.length === i
                        ? { scale: [1, 1.1, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.2 }}
                  >
                    {pinCode[i] ? "•" : ""}
                  </motion.div>
                ))}
              </div>

              {/* Hidden input for PIN */}
              <input
                type="text"
                inputMode="numeric"
                value={pinCode}
                onChange={(e) => handlePinChange(e.target.value)}
                maxLength={4}
                className="opacity-0 absolute"
                autoFocus
              />

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-red-500 mb-4"
                >
                  {error}
                </motion.p>
              )}

              {/* Number pad for easier input on mobile/tablet */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePinChange(pinCode + num)}
                    className="aspect-square rounded-2xl bg-gray-100 text-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePinChange(pinCode.slice(0, -1))}
                  className="aspect-square rounded-2xl bg-accent-100 text-xl font-bold hover:bg-accent-200 transition-colors"
                >
                  ⌫
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePinChange(pinCode + "0")}
                  className="aspect-square rounded-2xl bg-gray-100 text-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  0
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBack}
                  className="aspect-square rounded-2xl bg-gray-200 text-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  返回
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to home */}
        {!showPinInput && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.push("/")}
            className="mt-8 w-full text-center text-gray-600 hover:text-gray-800"
          >
            ← 返回首页
          </motion.button>
        )}
      </div>
    </main>
  );
}
