import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Star,
  Ticket,
  Heart,
  Receipt,
  Globe,
  Truck,
  Video,
  FileText,
  Tag,
  Percent,
  ExternalLink,
  MessageSquare,
  MapPin,
  Warehouse,
  Send,
  Store,
  Image,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  {
    label: "Contact Messages",
    href: ROUTES.ADMIN.CONTACT_MESSAGES,
    icon: MessageSquare,
  },
  {
    label: "Menus",
    href: "#",
    icon: Image,
    children: [
      { label: "Headers", href: ROUTES.ADMIN.HEADER },
      { label: "Categories", href: ROUTES.ADMIN.CATEGORIES },
      { label: "Subcategories", href: ROUTES.ADMIN.SUBCATEGORY },
    ],
  },
  {
    label: "Products",
    href: "#",
    icon: Package,
    children: [
      { label: "All Products", href: ROUTES.ADMIN.PRODUCTS },
      { label: "Attributes", href: ROUTES.ADMIN.ATTRIBUTE },
      { label: "Offers", href: ROUTES.ADMIN.OFFER },
      { label: "Country Pricing", href: ROUTES.ADMIN.COUNTRY_PRICING },
      { label: "Tags", href: ROUTES.ADMIN.TAGS },
      { label: "Market Links", href: ROUTES.ADMIN.EXTERNAL_MARKET },
      { label: "Shipping Pricing", href: ROUTES.ADMIN.SHIPPING_PRICING },
    ],
  },
  {
    label: "Orders",
    href: "#",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: ROUTES.ADMIN.ORDERS },
      { label: "Create Order", href: ROUTES.ADMIN.ORDERS_CREATE },
    ],
  },
  { label: "Banners", href: ROUTES.ADMIN.BANNERS, icon: Image },
  { label: "Users", href: ROUTES.ADMIN.USERS, icon: Users },
  { label: "Reviews", href: ROUTES.ADMIN.REVIEWS, icon: Star },
  { label: "Promo Codes", href: ROUTES.ADMIN.PROMO_CODE, icon: Ticket },
  { label: "Donations", href: ROUTES.ADMIN.DONATE, icon: Heart },
  {
    label: "Tax",
    href: "#",
    icon: Receipt,
    children: [
      { label: "Country Taxes", href: ROUTES.ADMIN.COUNTRY_TAXES },
    ],
  },
  { label: "Video Stories", href: ROUTES.ADMIN.VIDEO_STORY, icon: Video },
  { label: "Blog", href: ROUTES.ADMIN.BLOG, icon: FileText },
  {
    label: "Location",
    href: "#",
    icon: MapPin,
    children: [
      { label: "States", href: ROUTES.ADMIN.LOCATION_STATE },
    ],
  },
  {
    label: "Warehouse",
    href: "#",
    icon: Warehouse,
    children: [
      { label: "Locations", href: ROUTES.ADMIN.WAREHOUSE_LOCATION },
      { label: "Send to Warehouse", href: ROUTES.ADMIN.SEND_TO_WAREHOUSE },
    ],
  },
  {
    label: "Fulfillment",
    href: "#",
    icon: Truck,
    children: [
      { label: "Delhi Center", href: ROUTES.ADMIN.DELHI_STORE },
      { label: "Bangalore Center", href: ROUTES.ADMIN.BANGALORE_INVENTORY },
      { label: "SKU Mapping", href: ROUTES.ADMIN.SKU_MAPPING },
    ],
  },
  {
    label: "Jyotish",
    href: "#",
    icon: Moon,
    children: [
      { label: "Ad Campaigns", href: ROUTES.ADMIN.JYOTISH_AD_CAMPAIGN },
      { label: "Astrologer Details", href: ROUTES.ADMIN.JYOTISH_ASTROLOGER_DETAIL },
      { label: "Profile Edit Requests", href: ROUTES.ADMIN.JYOTISH_PROFILE_EDIT_REQUESTS },
      { label: "Services", href: ROUTES.ADMIN.JYOTISH_SERVICES },
      { label: "Durations", href: ROUTES.ADMIN.JYOTISH_DURATIONS },
      { label: "Tax Settings", href: ROUTES.ADMIN.JYOTISH_TAX_SETTINGS, icon: Percent },
    ],
  },
];

export const STORE_NAV: NavItem[] = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Categories", href: ROUTES.CATEGORIES },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Contact", href: ROUTES.CONTACT },
];

export const FOOTER_NAV = {
  company: [
    { label: "About Us", href: ROUTES.ABOUT },
    { label: "Contact Us", href: ROUTES.CONTACT },
    { label: "Blog", href: ROUTES.BLOG },
    { label: "FAQ", href: ROUTES.FAQ },
  ],
  policies: [
    { label: "Privacy Policy", href: ROUTES.PRIVACY },
    { label: "Terms & Conditions", href: ROUTES.TERMS },
    { label: "Shipping & Returns", href: ROUTES.SHIPPING_POLICY },
    { label: "Refund Policy", href: ROUTES.REFUND_POLICY },
  ],
  account: [
    { label: "My Account", href: ROUTES.DASHBOARD },
    { label: "My Orders", href: ROUTES.DASHBOARD_ORDERS },
    { label: "My Addresses", href: ROUTES.DASHBOARD_ADDRESSES },
    { label: "Wallet", href: ROUTES.DASHBOARD_WALLET },
  ],
};
