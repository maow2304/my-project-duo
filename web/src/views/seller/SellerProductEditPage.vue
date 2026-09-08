<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, PRODUCT_IMAGE_BUCKET } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { toast } from '../../lib/toast'
import Icon from '../../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(!!route.params.id)
const saving = ref(false)
const uploading = ref(false)

const form = ref({
  product_name: '',
  price: '',
  category: '',
  quantity: '',
  size: '',
  color: '',
  description: '',
  image: '',
})
const fileInput = ref(null)
const previewUrl = ref('')

async function load() {
  if (!isEdit.value) return
  loading.value = true
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('product_id', route.params.id)
    .eq('seller_id', auth.user.id)
    .maybeSingle()
  if (data) {
    form.value = {
      product_name: data.product_name || '',
      price: data.price,
      category: data.category || '',
      quantity: data.quantity,
      size: data.size || '',
      color: data.color || '',
      description: data.description || '',
      image: data.image || '',
    }
    previewUrl.value = data.image || ''
  }
  loading.value = false
}

function pickFile() {
  fileInput.value?.click()
}

async function onFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const path = `${auth.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path)
    const url = data.publicUrl
    if (form.value.image && form.value.image !== url) {
      supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([form.value.image.split('/').pop()]).catch(() => {})
    }
    form.value.image = url
    previewUrl.value = url
    toast('อัปโหลดรูปภาพสำเร็จ')
  } catch (e) {
    toast('อัปโหลดรูปไม่สำเร็จ ตรวจสอบว่าสร้าง bucket "product-images" แล้ว', 'error')
  } finally {
    uploading.value = false
    ev.target.value = ''
  }
}

async function save() {
  if (!form.value.product_name.trim() || !form.value.price || !form.value.quantity) {
    toast('กรุณากรอกชื่อ ราคา และจำนวนสินค้า', 'error')
    return
  }
  saving.value = true
  try {
    const payload = {
      product_name: form.value.product_name.trim(),
      price: Number(form.value.price),
      category: form.value.category.trim() || null,
      quantity: Number(form.value.quantity),
      size: form.value.size.trim() || null,
      color: form.value.color.trim() || null,
      description: form.value.description.trim() || null,
      image: form.value.image || null,
    }
    if (isEdit.value) {
      const { error } = await supabase
        .from('product')
        .update(payload)
        .eq('product_id', route.params.id)
      if (error) throw error
      toast('บันทึกการแก้ไขสินค้าแล้ว')
    } else {
      payload.seller_id = auth.user.id
      const { error } = await supabase.from('product').insert(payload)
      if (error) throw error
      toast('เพิ่มสินค้าสำเร็จ!')
    }
    router.push({ name: 'seller-products' })
  } catch (e) {
    toast(e?.message || 'บันทึกไม่สำเร็จ', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6 flex items-center gap-3">
      <button class="grid h-10 w-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 hover:text-brand-600"
        @click="router.push({ name: 'seller-products' })">
        <Icon name="arrow-left" :size="18" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-stone-800">{{ isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</h1>
        <p class="text-sm text-stone-500">กรอกข้อมูลสินค้าที่ต้องการ{{ isEdit ? 'แก้ไข' : 'ลงขาย' }}</p>
      </div>
    </div>

    <form v-if="!loading" class="space-y-5 rounded-2xl border border-stone-200 bg-white p-6" @submit.prevent="save">
      <!-- image -->
      <div>
        <label class="mb-2 block text-sm font-medium text-stone-600">รูปสินค้า</label>
        <div class="flex items-center gap-4">
          <button type="button" class="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 transition hover:border-brand-300"
            @click="pickFile">
            <img v-if="previewUrl" :src="previewUrl" class="h-full w-full object-cover" />
            <span v-else class="flex flex-col items-center gap-1 text-xs">
              <Icon name="image" :size="24" />
              {{ uploading ? 'กำลังอัปโหลด...' : 'เลือกรูป' }}
            </span>
          </button>
          <div class="flex-1">
            <button type="button" class="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50" @click="pickFile">อัปโหลดรูป</button>
            <p class="mt-2 text-xs text-stone-400">รองรับ JPG/PNG บันทึกลง Supabase Storage (bucket: product-images)<br />หากยังไม่สร้าง bucket ให้สร้างใน Dashboard → Storage</p>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-sm font-medium text-stone-600">ชื่อสินค้า *</label>
          <input v-model="form.product_name" required class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">ราคา (บาท) *</label>
          <input v-model="form.price" type="number" min="0" step="0.01" required class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">จำนวน (สต็อก) *</label>
          <input v-model="form.quantity" type="number" min="0" required class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">หมวดหมู่</label>
          <input v-model="form.category" list="categories" placeholder="เช่น เสื้อผ้า" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <datalist id="categories">
            <option value="เสื้อผ้า" /><option value="รองเท้า" /><option value="กระเป๋า" /><option value="เครื่องประดับ" /><option value="กีฬา" />
          </datalist>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">ไซส์</label>
          <input v-model="form.size" list="sizes" placeholder="เช่น M" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <datalist id="sizes">
            <option value="S" /><option value="M" /><option value="L" /><option value="XL" /><option value="42" /><option value="Free" />
          </datalist>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">สี</label>
          <input v-model="form.color" list="colors" placeholder="เช่น Black" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <datalist id="colors">
            <option value="Black" /><option value="White" /><option value="Blue" /><option value="Gray" /><option value="Khaki" /><option value="Navy" />
          </datalist>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">รายละเอียดสินค้า</label>
        <textarea v-model="form.description" rows="4" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"></textarea>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" class="rounded-full border border-stone-300 px-6 py-2.5 text-sm text-stone-600 hover:bg-stone-50" @click="router.push({ name: 'seller-products' })">ยกเลิก</button>
        <button type="submit" :disabled="saving || uploading"
          class="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          {{ isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า' }}
        </button>
      </div>
    </form>
  </div>
</template>