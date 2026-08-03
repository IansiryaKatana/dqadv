export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      dq_admin_users: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_admin_users']['Row']> & {
          email: string
        }
        Update: Partial<Database['public']['Tables']['dq_admin_users']['Row']>
      }
      dq_navigation_links: {
        Row: {
          id: string
          label: string
          href: string
          sort_order: number
          is_active: boolean
          show_in_header: boolean
          show_in_footer: boolean
          footer_group: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_navigation_links']['Row']> & {
          label: string
          href: string
        }
        Update: Partial<Database['public']['Tables']['dq_navigation_links']['Row']>
      }
      dq_hero_content: {
        Row: {
          id: string
          title_line1: string
          title_line2: string
          title_line3: string
          highlight_word: string
          description: string
          image_url: string
          image_url_tablet: string | null
          image_url_mobile: string | null
          primary_cta_label: string
          primary_cta_url: string
          secondary_cta_label: string
          secondary_cta_url: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_hero_content']['Row']> & {
          title_line1: string
          title_line2: string
          title_line3: string
          highlight_word: string
          description: string
          image_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_hero_content']['Row']>
      }
      dq_whats_inside: {
        Row: {
          id: string
          heading: string
          highlight_word: string
          intro_html: string
          bullets: Json
          image_url: string
          background_color: string | null
          is_active: boolean
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_whats_inside']['Row']> & {
          intro_html: string
          image_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_whats_inside']['Row']>
      }
      dq_venture_section: {
        Row: {
          id: string
          heading: string
          highlight_word: string
          subtitle: string
          description: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_venture_section']['Row']> & {
          description: string
        }
        Update: Partial<Database['public']['Tables']['dq_venture_section']['Row']>
      }
      dq_venture_images: {
        Row: {
          id: string
          image_url: string
          alt: string
          caption: string | null
          sort_order: number
          is_active: boolean
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_venture_images']['Row']> & {
          image_url: string
          alt: string
        }
        Update: Partial<Database['public']['Tables']['dq_venture_images']['Row']>
      }
      dq_donation_products: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          image_url: string
          price: number | null
          currency: string | null
          category: string | null
          stock_status: string | null
          cta_label: string
          cta_url: string
          kind: string
          sort_order: number
          is_active: boolean
          published: boolean
          requires_shipping?: boolean
          is_free?: boolean
          impact_statement?: string | null
          min_amount?: number | null
          max_quantity?: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_donation_products']['Row']> & {
          slug: string
          title: string
          description: string
          image_url: string
          cta_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_donation_products']['Row']>
      }
      dq_story_posters: {
        Row: {
          id: string
          title: string
          image_url: string
          video_url: string | null
          link_url: string | null
          sort_order: number
          is_active: boolean
          published: boolean
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_story_posters']['Row']> & {
          title: string
          image_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_story_posters']['Row']>
      }
      dq_authors: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_authors']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['dq_authors']['Row']>
      }
      dq_articles: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string
          cover_image_url: string
          category: string
          author_id: string | null
          body_html: string | null
          read_time: string | null
          status: string
          published_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_articles']['Row']> & {
          slug: string
          title: string
          excerpt: string
          cover_image_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_articles']['Row']>
      }
      dq_promo_tiles: {
        Row: {
          id: string
          title: string
          image_url: string
          link_url: string
          sort_order: number
          is_active: boolean
          published: boolean
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_promo_tiles']['Row']> & {
          title: string
          image_url: string
          link_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_promo_tiles']['Row']>
      }
      dq_quran_wiki_articles: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string
          cover_image_url: string
          category: string
          author_id: string | null
          body_html: string | null
          read_time: string | null
          status: string
          published_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_quran_wiki_articles']['Row']> & {
          slug: string
          title: string
          excerpt: string
          cover_image_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_quran_wiki_articles']['Row']>
      }
      dq_quran_wiki_banner: {
        Row: {
          id: string
          title: string
          subtitle: string
          image_url: string
          link_url: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_quran_wiki_banner']['Row']> & {
          title: string
          subtitle: string
          image_url: string
          link_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_quran_wiki_banner']['Row']>
      }
      dq_footer_settings: {
        Row: {
          id: string
          about_text: string
          email: string
          phone: string
          address: string
          copyright: string
          developer_credit: string | null
          social_links: Json
          is_active: boolean
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_footer_settings']['Row']> & {
          about_text: string
          email: string
          phone: string
          address: string
          copyright: string
        }
        Update: Partial<Database['public']['Tables']['dq_footer_settings']['Row']>
      }
      dq_site_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_site_settings']['Row']> & {
          key: string
          value: string
        }
        Update: Partial<Database['public']['Tables']['dq_site_settings']['Row']>
      }
      dq_cms_media: {
        Row: {
          id: string
          filename: string
          public_url: string
          folder: string | null
          kind: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_cms_media']['Row']> & {
          filename: string
          public_url: string
        }
        Update: Partial<Database['public']['Tables']['dq_cms_media']['Row']>
      }
      dq_form_submissions: {
        Row: {
          id: string
          form_type: string
          name: string | null
          email: string | null
          phone: string | null
          message: string | null
          payload: Json | null
          status: string
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['dq_form_submissions']['Row']> & {
          form_type: string
        }
        Update: Partial<Database['public']['Tables']['dq_form_submissions']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: {
      dq_can_bootstrap_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      dq_register_admin_user: {
        Args: {
          p_role: 'owner' | 'admin' | 'editor' | 'viewer'
        }
        Returns: string
      }
      dq_get_my_admin_profile: {
        Args: Record<string, never>
        Returns: {
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          is_active: boolean
        }[]
      }
      dq_record_book_view: {
        Args: {
          p_book_id: string
          p_visitor_id: string
        }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
