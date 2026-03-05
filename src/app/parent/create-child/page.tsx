"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Camera, AlertCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useGameStore, GradeLevel } from "@/stores/gameStore";
import { generateId } from "@/lib/utils";

const AVATARS = [
  { emoji: "👦", name: "男孩1" },
  { emoji: "👧", name: "女孩1" },
  { emoji: "👦🏻", name: "男孩2" },
  { emoji: "👧🏻", name: "女孩2" },
  { emoji: "🧒", name: "孩子" },
  { emoji: "👶", name: "宝宝" },
  { emoji: "🦊", name: "小狐狸" },
  { emoji: "🐼", name: "熊猫" },
];

const GRADES = [
  { value: 1, label: "一年级" },
  { value: 2, label: "二年级" },
  { value: 3, label: "三年级" },
  { value: 4, label: "四年级" },
  { value: 5, label: "五年级" },
  { value: 6, label: "六年级" },
];

const SEMESTERS = [
  { value: "上学期", label: "上学期 (9月-1月)" },
  { value: "下学期", label: "下学期 (2月-7月)" },
] as const;

export default function CreateChildPage() {
  const router = useRouter();
  const { addChild } = useGameStore();

  const [childName, setChildName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(3); // Default to Grade 3
  const [selectedSemester, setSelectedSemester] = useState<"上学期" | "下学期">("下学期"); // Default to 2nd semester
  const [pinCode, setPinCode] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getGradeDisplayName = (): string => {
    return `小学${GRADES.find(g => g.value === selectedGrade)?.label} ${selectedSemester}`;
  };

  const validateForm = () => {
    if (!childName || childName.length < 1) {
      setError("请输入孩子的昵称");
      return false;
    }
    if (!selectedAvatar) {
      setError("请选择一个头像");
      return false;
    }
    if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      setError("请输入4位数字PIN码");
      return false;
    }
    if (pinCode !== confirmPin) {
      setError("两次输入的PIN码不一致");
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
      const gradeLevel: GradeLevel = {
        grade: selectedGrade,
        semester: selectedSemester,
        displayName: getGradeDisplayName(),
      };

      const newChild = {
        id: generateId(),
        name: childName,
        avatarUrl: selectedAvatar,
        gradeLevel,
        currentPoints: 0,
        totalPointsEarned: 0,
        currentLevel: 1,
      };

      addChild(newChild);

      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/parent/dashboard");
    } catch (err) {
      setError("创建失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers
    const numeric = value.replace(/\D/g, "").slice(0, 4);
    setPinCode(numeric);
  };

  const handleConfirmPinChange = (value: string) => {
    const numeric = value.replace(/\D/g, "").slice(0, 4);
    setConfirmPin(numeric);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            创建孩子档案
          </h1>
          <p className="text-gray-600">为您的孩子创建一个学习账户</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Child Name */}
            <Input
              type="text"
              label="孩子的昵称"
              placeholder="小明"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
            />

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                选择头像
              </label>
              <div className="grid grid-cols-4 gap-4">
                {AVATARS.map((avatar) => (
                  <motion.button
                    key={avatar.emoji}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAvatar(avatar.emoji)}
                    className={`aspect-square rounded-2xl border-4 text-4xl flex items-center justify-center transition-all ${
                      selectedAvatar === avatar.emoji
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {avatar.emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Grade Level Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                选择年级
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {GRADES.map((grade) => (
                  <motion.button
                    key={grade.value}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedGrade(grade.value)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedGrade === grade.value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {grade.label}
                  </motion.button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-3 mt-4">
                选择学期
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SEMESTERS.map((semester) => (
                  <motion.button
                    key={semester.value}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedSemester(semester.value)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedSemester === semester.value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {semester.label}
                  </motion.button>
                ))}
              </div>

              {/* Current selection display */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  📚 当前选择: <span className="font-bold">{getGradeDisplayName()}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  系统将根据孩子的年级推荐适合的学习内容
                </p>
              </div>
            </div>

            {/* PIN Code */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="设置PIN码（4位数字）"
                placeholder="1234"
                value={pinCode}
                onChange={(e) => handlePinChange(e.target.value)}
                required
                maxLength={4}
                inputMode="numeric"
              />
              <Input
                type="text"
                label="确认PIN码"
                placeholder="1234"
                value={confirmPin}
                onChange={(e) => handleConfirmPinChange(e.target.value)}
                required
                maxLength={4}
                inputMode="numeric"
                error={
                  confirmPin && pinCode !== confirmPin
                    ? "PIN码不一致"
                    : undefined
                }
              />
            </div>

            {/* PIN Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 孩子将使用这个4位PIN码登录学习界面，请设置一个容易记住的数字。
              </p>
            </div>

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

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                返回
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "创建中..." : "创建档案"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
