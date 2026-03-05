import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-pop">
          <h1 className="text-6xl md:text-7xl font-display font-bold gradient-text mb-4">
            英语冒险岛
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            开启你的英语口语冒险之旅！
          </p>
          <div className="flex justify-center gap-8 text-5xl mb-8">
            <span className="animate-float" style={{ animationDelay: '0s' }}>🏝️</span>
            <span className="animate-float" style={{ animationDelay: '0.2s' }}>🗣️</span>
            <span className="animate-float" style={{ animationDelay: '0.4s' }}>🎯</span>
            <span className="animate-float" style={{ animationDelay: '0.6s' }}>🏆</span>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Parent Entry */}
          <Link
            href="/parent/login"
            className="group relative bg-white rounded-3xl p-8 shadow-xl card-hover overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">家长入口</h2>
              <p className="text-gray-600">管理孩子档案、设置奖品、查看学习进度</p>
              <div className="mt-6 flex items-center text-primary-600 font-semibold">
                <span>进入管理后台</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Child Entry */}
          <Link
            href="/child/login"
            className="group relative bg-white rounded-3xl p-8 shadow-xl card-hover overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-200 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="text-6xl mb-4">🧒</div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">孩子入口</h2>
              <p className="text-gray-600">完成口语任务、赚取积分、兑换喜欢的奖品</p>
              <div className="mt-6 flex items-center text-secondary-600 font-semibold">
                <span>开始冒险</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">🎤</div>
            <p className="font-semibold text-gray-700">口语练习</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <p className="font-semibold text-gray-700">积分奖励</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">🎁</div>
            <p className="font-semibold text-gray-700">奖品兑换</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="font-semibold text-gray-700">成就系统</p>
          </div>
        </div>
      </div>
    </main>
  );
}
