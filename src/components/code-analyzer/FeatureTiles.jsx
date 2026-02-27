import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Zap,
  FileCode,
  MessageSquare,
  GitBranch,
  Users,
  Brain,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description: "Understand any codebase in seconds with intelligent analysis",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description: "Detect vulnerabilities and security issues automatically",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Code Quality",
    description: "Get complexity scores and improvement suggestions",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: FileCode,
    title: "Multi-Language",
    description: "Support for JavaScript, TypeScript, Python, Go, and more",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageSquare,
    title: "Chat Interface",
    description: "Ask questions naturally about any repository",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: GitBranch,
    title: "Flow Diagrams",
    description: "Visualize architecture with auto-generated diagrams",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Profile Analysis",
    description: "Explore developer profiles and their contributions",
    gradient: "from-teal-500 to-green-500",
  },
  {
    icon: Brain,
    title: "Smart Context",
    description: "AI selects relevant files for accurate responses",
    gradient: "from-red-500 to-orange-500",
  },
];

export function FeatureTiles() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {FEATURES.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur" 
               style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
          
          <div className="relative bg-zinc-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors h-full">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
