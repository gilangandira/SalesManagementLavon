"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, User, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://forestgreen-shrew-854212.hostingersite.com/public/api'}/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setName(data.name || "");
                    setPhone(data.phone || "");
                    setLocation(data.location || "");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setUpdating(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://forestgreen-shrew-854212.hostingersite.com/public/api'}/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone, location })
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user); // Update local user state
                alert("Profile updated successfully!");
                // No need to reload if we update state correctly, but sidebar might need it.
                window.location.reload();
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <SidebarInset>
                <SiteHeader />
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="h-24 w-24 rounded-full bg-muted"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                </div>
            </SidebarInset>
        )
    }

    if (!user) return null;

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8 max-w-5xl mx-auto w-full">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[300px_1fr]">

                    {/* Left Column: User Card */}
                    <Card className="h-fit">
                        <CardHeader className="flex flex-col items-center text-center pb-2">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl mb-4">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=256`} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-xl">{user.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" /> {user.email}
                            </CardDescription>
                            <div className="mt-4">
                                <Badge variant="secondary" className="px-4 py-1 text-sm capitalize">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {user.role}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Joined</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="text-green-600 font-medium">Active</span>
                                </div>
                                {/* Show Phone/Location in card or just leave as is? The design has them in form. */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Edit Details */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" defaultValue={user.email} className="pl-9" disabled />
                                        </div>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Email address cannot be changed.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone (Optional)</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    placeholder="+62..."
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="location">Location (Optional)</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="location"
                                                    placeholder="Jakarta, ID"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <Button type="submit" disabled={updating}>
                                            {updating ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </SidebarInset>
    );
}
