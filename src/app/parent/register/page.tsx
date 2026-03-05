"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ParentRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!name || name.length < 2) {
      setError("请输入您的姓名（至少2个字符）");
      return false;
    }
    if (!email || !email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return false;
    }
    if (password.length < 6) {
      setError("密码至少需要6个字符");
      return false;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual Supabase auth
      // For now, simulate registration and redirect to create child
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/parent/create-child");
    } catch (err) {
      setError("注册失败，请重试");
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
          <p className="text-gray-600 mt-2">家长注册</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <Input
              type="text"
              label="您的姓名"
              placeholder="张三"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
                          />

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
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            
            />

            {/* Confirm Password */}
            <Input
              type="password"
              label="确认密码"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              error={
                confirmPassword && password !== confirmPassword
                  ? "密码不一致"
                  : undefined
              }
        
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

            {/* Success message */}
            {confirmPassword && password === confirmPassword && password.length >= 6 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-success-50 text-success-600 rounded-xl text-sm"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                密码设置成功
              </motion.div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              注册即表示您同意我们的服务条款和隐私政策
            </p>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              已有账号？
              <Link
                href="/parent/login"
                className="text-primary-600 font-semibold hover:underline ml-1"
              >
                立即登录
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
