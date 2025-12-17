"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  HandCoins,
  House,
  Settings2,
  SquareTerminal,
  Users,
  UserStar,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

// Data contoh untuk aplikasi.
// Objek ini berisi konfigurasi untuk tim, navigasi utama (navMain), dan proyek.
const data = {
  teams: [
    {
      name: "Lavon",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  // Struktur menu navigasi utama
  navMain: [
    {
      title: "Customers",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "Customer Dashboard",
          url: "/customers",
        },
        {
          title: "Customers Data",
          url: "/customers/data",
        },

      ],
    },
    {
      title: "Clusters",
      url: "#",
      icon: House,
      items: [
        {
          title: "Cluster Dashboard",
          url: "/clusters",
        },
        {
          title: "Clusters Data",
          url: "/clusters/data",
        },

      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: HandCoins,
      items: [
        {
          title: "Dashboard Finance",
          url: "/sales",
        },
        {
          title: "Sales Data",
          url: "/sales/data",
        },

        {
          title: "History Payment",
          url: "/sales/payments",
        },

      ],
    },
  ],
  projects: [
    {
      name: "Dashboard",
      url: "/",
      icon: Frame,
    },
  ],
};

// Komponen AppSidebar: Menampilkan sidebar aplikasi
// Props: menerima 'user' untuk data pengguna yang sedang login & props standar Sidebar
export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
  // Menggunakan data user yang dikirim lewat props, atau menggunakan data dummy "Guest" jika tidak ada
  const activeUser = user || { name: "Guest", email: "guest@example.com", avatar: "", role: "guest" };

  // Jika user tidak punya avatar, gunakan generator avatar sederhana dari ui-avatars.com
  if (!activeUser.avatar) {
    activeUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.name)}`;
  }

  // Menyalin (kloning) item navigasi agar perubahan di sini tidak mengubah data asli secara global
  const navMainItems = data.navMain.map((item) => ({
    ...item,
    items: [...(item.items || [])],
  }));

  // Logika Filter Menu Berdasarkan Role (Peran) User

  // 1. Role: Finance
  if (activeUser.role === 'finance') {
    // Finance (dulunya 'Sales' di request user)
    // - Boleh LIHAT: History Payment
    // - TIDAK Boleh: Membuat (Create) Customers, Clusters, atau Sales baru

    // Menu Customers (Index 0) - Sembunyikan menu "Create"
    if (navMainItems[0]) {
      navMainItems[0].items = navMainItems[0].items.filter((item: any) => !item.title.startsWith("Create") && item.title !== "Create Customers");
    }
    // Menu Clusters (Index 1) - Sembunyikan menu "Create"
    if (navMainItems[1]) {
      navMainItems[1].items = navMainItems[1].items.filter((item: any) => !item.title.startsWith("Create"));
    }
    // Menu Sales (Index 2) - Sembunyikan menu "Create", tapi BIARKAN "History Payment"
    if (navMainItems[2]) {
      navMainItems[2].items = navMainItems[2].items.filter((item: any) =>
        !item.title.startsWith("Create") &&
        item.title !== "Create New Sales"
      );
    }
  }

  // 2. Role: Sales
  // 2. Role: Sales
  if (activeUser.role === 'sales') {
    // Sales (dulunya 'Marketing' di request user)
    // - Boleh: Membuat (Create) Customers, Sales
    // - TIDAK Boleh: Melihat History Payment (karena itu urusan Finance)

    // Menu Clusters (Index 1) - Sembunyikan "Create" (Hanya Admin yang boleh buat Cluster)
    if (navMainItems[1]) {
      navMainItems[1].items = navMainItems[1].items.filter((item: any) => !item.title.startsWith("Create"));
    }
    // Menu Sales (Index 2)
    if (navMainItems[2]) {
      // Sembunyikan "History Payment" (Sales masih boleh lihat Sales Data & Dashboard Finance)
      navMainItems[2].items = navMainItems[2].items.filter((item: any) => item.title !== "History Payment");
    }
  }

  // 3. Role: Admin
  // Admin mendapatkan menu tambahan khusus (User Management, Rank, dll)
  if (activeUser.role === 'admin') {
    navMainItems.push({
      title: "Admin",
      url: "#",
      icon: UserStar,
      isActive: true, // Menu otomatis terbuka
      items: [
        { title: "All Users", url: "/users" },
        { title: "Marketing Rank", url: "/admin/rank" }
      ]
    } as any);
  }

  // Gabungkan data konfigurasi navigasi baru dengan user yang aktif
  const navData = {
    ...data,
    navMain: navMainItems,
    user: activeUser
  };

  // Render Sidebar
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  <img src="/logo.png" alt="Lavon Logo" className="size-8 object-cover rounded-lg" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Lavon</span>
                  <span className="truncate text-xs">Management Sales</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* NavProjects: Menu navigasi bagian atas (Dashboard utama) */}
        <NavProjects projects={data.projects} />
        {/* NavMain: Menu navigasi utama (Customers, Clusters, Finance, dll) */}
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* NavUser: Bagian footer sidebar menampilkan profil user dan logout */}
        <NavUser user={navData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
