"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useGameStore } from "@/stores/gameStore";

export default function ParentLoginPage() {
  const router = useRouter();
  const { setParentId } = useGameStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual Supabase auth
      // For now, simulate login
      if (email && password.length >= 6) {
        const mockParentId = "parent_" + Date.now();
        setParentId(mockParentId);

        // Check if there are existing children
        const { children } = useGameStore.getState();
        if (children.length > 0) {
          router.push("/parent/dashboard");
        } else {
          router.push("/parent/create-child");
        }
      } else {
        setError("请输入有效的邮箱和密码（至少6位）");
      }
    } catch (err) {
      setError("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-display font-bold gradient-text">
              英语冒险岛
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">家长登录</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <Input
              type="email"
              label="邮箱"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {/* Password */}
            <Input
              type="password"
              label="密码"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              还没有账号？
              <Link
                href="/parent/register"
                className="text-primary-600 font-semibold hover:underline ml-1"
              >
                立即注册
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
          >
            ← 返回首页
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
