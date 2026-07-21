"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi } from "@/lib/api";
import type { Listing } from "@/types";
import { Search, RefreshCw, Package, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MarketplacePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role === "free") {
      router.push("/dashboard/payment");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role === "free") return;

    marketplaceApi
      .listListings({ page: 1, page_size: 50, q: search || undefined })
      .then((res) => setListings(res.listings))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, search]);

  if (authLoading || !user || user.role === "free") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const getCategoryBadge = (category: string) => {
    const styles = {
      account_sale: "bg-purple-100 text-purple-800",
      task: "bg-blue-100 text-blue-800",
      service: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[category as keyof typeof styles] || ""}`}>
        {category.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-8 h-8 text-gold-500" />
            <h1 className="text-3xl font-bold text-gray-900">Account Marketplace</h1>
          </div>
          <p className="text-gray-600">Browse accounts for sale and available tasks</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading marketplace...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">Check back later or try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    {getCategoryBadge(listing.category)}
                    {listing.price && (
                      <span className="text-lg font-bold text-gold-600">
                        KES {listing.price}
                      </span>
                    )}
                    {!listing.price && (
                      <span className="text-sm text-gray-500">Negotiable</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{listing.vendor_name}</span>
                    </div>
                    <Button size="sm" className="bg-gold-500 hover:bg-gold-600">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
