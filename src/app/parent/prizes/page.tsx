"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Prize = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  pointsRequired: number;
  isActive: boolean;
};

const MOCK_PRIZES: Prize[] = [
  {
    id: "p1",
    name: "冰淇淋",
    imageUrl: "🍦",
    priceCents: 200, // 2.00 yuan
    pointsRequired: 200,
    isActive: true,
  },
  {
    id: "p2",
    name: "乐高积木小套装",
    imageUrl: "🧱",
    priceCents: 5000, // 50.00 yuan
    pointsRequired: 5000,
    isActive: true,
  },
  {
    id: "p3",
    name: "动画片30分钟",
    imageUrl: "📺",
    priceCents: 100, // 1.00 yuan (equivalent)
    pointsRequired: 100,
    isActive: true,
  },
];

type Form = {
  name: string;
  imageUrl: string;
  price: string; // in yuan
};

export default function PrizesPage() {
  const router = useRouter();
  const [prizes, setPrizes] = useState<Prize[]>(MOCK_PRIZES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>({
    name: "",
    imageUrl: "",
    price: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddPrize = () => {
    setShowForm(true);
    setEditingId(null);
    setForm({ name: "", imageUrl: "", price: "" });
  };

  const handleEditPrize = (prize: Prize) => {
    setShowForm(true);
    setEditingId(prize.id);
    setForm({
      name: prize.name,
      imageUrl: prize.imageUrl || "",
      price: (prize.priceCents / 100).toString(),
    });
  };

  const handleDeletePrize = (id: string) => {
    if (confirm("确定要删除这个奖品吗？")) {
      setPrizes(prizes.filter((p) => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setPrizes(
      prizes.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceInCents = Math.round(parseFloat(form.price) * 100);
    const pointsRequired = priceInCents; // 1 yuan = 100 points

    if (editingId) {
      // Update existing prize
      setPrizes(
        prizes.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: form.name,
                imageUrl: form.imageUrl || null,
                priceCents: priceInCents,
                pointsRequired,
              }
            : p
        )
      );
    } else {
      // Add new prize
      const newPrize: Prize = {
        id: "p" + Date.now(),
        name: form.name,
        imageUrl: form.imageUrl || null,
        priceCents: priceInCents,
        pointsRequired,
        isActive: true,
      };
      setPrizes([...prizes, newPrize]);
    }

    setShowForm(false);
    setForm({ name: "", imageUrl: "", price: "" });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/parent/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">奖品管理</h1>
          </div>

          <Button variant="primary" onClick={handleAddPrize} className="gap-2">
            <Plus className="w-4 h-4" />
            添加奖品
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6"
        >
          <p className="text-blue-800 text-sm">
            💡 <strong>积分换算规则：</strong>1元人民币 = 100积分。孩子可以用赚取的积分兑换您设置的奖品。
          </p>
        </motion.div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {editingId ? "编辑奖品" : "添加新奖品"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    label="奖品名称"
                    placeholder="例如：冰淇淋、乐高积木"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      label="图片链接（可选）"
                      placeholder="https://example.com/image.jpg"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                    <Input
                      type="number"
                      label="价格（元）"
                      placeholder="10.00"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>

                  {form.price && (
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl text-sm">
                      需要积分: <strong>{Math.round(parseFloat(form.price) * 100)}</strong> 积分
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                    >
                      {editingId ? "保存修改" : "添加奖品"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prizes List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            奖品列表 ({prizes.length})
          </h2>

          {prizes.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-gray-600 mb-4">还没有添加任何奖品</p>
              <Button variant="primary" onClick={handleAddPrize} className="gap-2">
                <Plus className="w-4 h-4" />
                添加第一个奖品
              </Button>
            </Card>
          ) : (
            prizes.map((prize) => (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card
                  className={`p-4 ${!prize.isActive ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Prize Image/Emoji */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                      {prize.imageUrl ? (
                        prize.imageUrl.startsWith("http") ? (
                          <img
                            src={prize.imageUrl}
                            alt={prize.name}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).parentElement!.textContent = "🎁";
                            }}
                          />
                        ) : (
                          <span>{prize.imageUrl}</span>
                        )
                      ) : (
                        <span>🎁</span>
                      )}
                    </div>

                    {/* Prize Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {prize.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>¥{formatPrice(prize.priceCents)}</span>
                        <span className="text-gray-400">•</span>
                        <Badge variant="primary" size="sm">
                          {prize.pointsRequired} 积分
                        </Badge>
                        {!prize.isActive && (
                          <Badge variant="default" size="sm">已隐藏</Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(prize.id)}
                        title={prize.isActive ? "隐藏" : "显示"}
                      >
                        {prize.isActive ? "👁️" : "👁️‍🗨️"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrize(prize)}
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrize(prize.id)}
                        title="删除"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-100 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-3">💡 设置建议</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 设置小目标（10-50积分）：额外的屏幕时间、小零食</li>
            <li>• 设置中等目标（100-500积分）：外出活动、小玩具</li>
            <li>• 设置大目标（1000+积分）：乐高、书籍、特殊体验</li>
            <li>• 可以使用emoji或图片让奖品更有吸引力</li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
}

// AnimatePresence component for the form animation
function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
