import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-100 via-secondary-100 to-accent-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-pop">
          <h1 className="text-7xl md:text-8xl font-display font-bold gradient-text mb-4">
            Learnie
          </h1>
          <p className="text-2xl text-gray-600 mb-6">
            多学科智能学习平台，让学习变得有趣！
          </p>
          <p className="text-lg text-gray-500 mb-8">
            开启英语、数学、语文等学科的探索之旅
          </p>
          <div className="flex justify-center gap-6 text-5xl mb-8">
            <span className="animate-float" style={{ animationDelay: '0s' }}>📚</span>
            <span className="animate-float" style={{ animationDelay: '0.15s' }}>🔤</span>
            <span className="animate-float" style={{ animationDelay: '0.3s' }}>🔢</span>
            <span className="animate-float" style={{ animationDelay: '0.45s' }}>✏️</span>
            <span className="animate-float" style={{ animationDelay: '0.6s' }}>🎯</span>
            <span className="animate-float" style={{ animationDelay: '0.75s' }}>🏆</span>
          </div>
        </div>

        {/* Subject Modules */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">选择学习模块</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/child/login?subject=english"
              className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl card-hover overflow-hidden text-white"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="text-5xl mb-3">🏝️</div>
                <h3 className="text-2xl font-bold mb-1">英语冒险岛</h3>
                <p className="text-white/90 text-sm mb-3">口语练习 · 单词 · 句子 · 闯关</p>
                <div className="flex items-center font-semibold">
                  <span>开始探险</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            <div className="group relative bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 shadow-xl overflow-hidden text-gray-600">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative text-center">
                <div className="text-5xl mb-3">🔢</div>
                <h3 className="text-2xl font-bold mb-1">数学乐园</h3>
                <p className="text-sm mb-3">逻辑思维 · 计算 · 趣味数学</p>
                <div className="bg-white/50 rounded-lg px-4 py-2 text-sm font-semibold">
                  即将推出
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 shadow-xl overflow-hidden text-gray-600">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative text-center">
                <div className="text-5xl mb-3">✏️</div>
                <h3 className="text-2xl font-bold mb-1">语文天地</h3>
                <p className="text-sm mb-3">拼音 · 识字 · 阅读理解</p>
                <div className="bg-white/50 rounded-lg px-4 py-2 text-sm font-semibold">
                  即将推出
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">家长管理</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/parent/register"
              className="group relative bg-white rounded-3xl p-6 shadow-xl card-hover overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">家长注册</h2>
                <p className="text-gray-600 text-sm">创建家庭账户，管理孩子学习</p>
                <div className="mt-4 flex items-center text-primary-600 font-semibold">
                  <span>免费注册</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/parent/login"
              className="group relative bg-white rounded-3xl p-6 shadow-xl card-hover overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-200 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="text-5xl mb-3">🔐</div>
                <h2 className="text-2xl font-display font-bold text-gray-800 mb-2">家长登录</h2>
                <p className="text-gray-600 text-sm">管理孩子档案、设置奖品、查看进度</p>
                <div className="mt-4 flex items-center text-secondary-600 font-semibold">
                  <span>登录后台</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-4">学习特色</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-4xl mb-2">🎤</div>
              <p className="font-semibold text-gray-700 text-sm">AI 口语评测</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-4xl mb-2">⭐</div>
              <p className="font-semibold text-gray-700 text-sm">积分奖励</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-4xl mb-2">🎁</div>
              <p className="font-semibold text-gray-700 text-sm">奖品兑换</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-4xl mb-2">🏅</div>
              <p className="font-semibold text-gray-700 text-sm">成就系统</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
