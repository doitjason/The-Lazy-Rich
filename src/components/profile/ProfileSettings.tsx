"use client";

import { Bell, Moon, DollarSign, HelpCircle, Shield, LogOut, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

export function ProfileSettings() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col items-center text-center space-y-3 pt-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/20 shadow-lg">
                    <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Alex Johnson</h2>
                    <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        Pro Member
                    </span>
                </div>
            </motion.div>

            {/* Preferences Group */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">Preferences</h3>
                <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Notifications</span>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Moon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Dark Mode</span>
                            </div>
                            <Switch />
                        </div>

                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Currency</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="text-sm">USD</span>
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Support Group */}
            <motion.div variants={item} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1 uppercase tracking-wide">Support</h3>
                <Card className="overflow-hidden border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-md">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <HelpCircle className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Help Center</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <span className="font-medium">Privacy Policy</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Logout */}
            <motion.div variants={item} className="pt-4">
                <Button variant="destructive" className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-12 backdrop-blur-md shadow-none">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-4">
                    Version 1.0.0 • Build 2024
                </p>
            </motion.div>
        </motion.div>
    );
}
