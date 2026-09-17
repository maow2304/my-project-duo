<script setup>
// หน้าเพิ่ม/แก้ไขสินค้าของผู้ขาย (ใช้เส้นทางเดียวกัน - ดูจาก params.id ว่าเป็นโหมดไหน)
// ฟอร์มใช้ component ชุด ui/ (FormInput, FormTextarea, ImageUploader) ให้สไตล์เดียวกันทั้งหน้า
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductBySeller, createProduct, updateProduct } from '@/api/products'
import { PRODUCT_CATEGORIES, PRODUCT_SIZES, PRODUCT_COLORS } from '@/lib/constants'
import { isValidPrice, isNonNegativeInt } from '@/lib/validators'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/lib/toast'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormInput from '@/components/ui/FormInput.vue'
import FormTextarea from '@/components/ui/FormTextarea.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(!!route.params.id)
const saving = ref(false)
// ข้อความ error รายช่อง (แสดงใต้ input ที่เกี่ยวข้อง) - ล้างทุกครั้งที่พิมพ์
const errors = ref({})

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

// โหลดข้อมูลเดิมมาใส่ฟอร์มเมื่อแก้ไข (เช็กด้วยว่าเป็นสินค้าของเราจริง)
async function load() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const data = await getProductBySeller(route.params.id, auth.user.id)
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
    }
  } catch (e) {
    // ไม่เจอสินค้า = ฟอร์มว่าง ให้ผู้ใช้กลับไปหน้าจัดการ
  } finally {
    loading.value = false
  }
}

// ตรวจรูปแบบข้อมูลก่อนบันทึก; คืน error รายช่อง (ช่องไหนผ่าน = เป็น "")
function validate() {
  const errs = {}
  const name = form.value.product_name.trim()
  const price = String(form.value.price).trim()
  const quantity = String(form.value.quantity).trim()

  // ชื่อสินค้า: ต้องมี ไม่ยาวเกิน และไม่ขึ้นต้นด้วยเว้นวรรค
  if (!name) errs.product_name = 'กรุณากรอกชื่อสินค้า'
  else if (name.length > 100) errs.product_name = 'ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร'

  // ราคา: ตัวเลขเท่านั้น ไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง (กัน abc/e/เครื่องหมาย)
  if (!price) errs.price = 'กรุณากรอกราคา'
  else if (!isValidPrice(price)) errs.price = 'ราคาต้องเป็นตัวเลข เช่น 250 หรือ 250.50 เท่านั้น'
  else if (Number(price) > 9999999) errs.price = 'ราคาสูงเกินไป'

  // จำนวน: เลขเต็มไม่ติดลบเท่านั้น (กัน abc/ทศนิยม/ลบ)
  if (!quantity) errs.quantity = 'กรุณากรอกจำนวน'
  else if (!isNonNegativeInt(quantity)) errs.quantity = 'จำนวนต้องเป็นเลขจำนวนเต็มไม่ติดลบ เช่น 5'
  else if (Number(quantity) > 999999) errs.quantity = 'จำนวนสูงเกินไป'

  // หมวดหมู่/ไซส์/สี: ว่างได้แต่จำกัดความยาว
  if (form.value.category.trim().length > 50) errs.category = 'หมวดหมู่ไม่เกิน 50 ตัวอักษร'
  if (form.value.size.trim().length > 50) errs.size = 'ไซส์ไม่เกิน 50 ตัวอักษร'
  if (form.value.color.trim().length > 50) errs.color = 'สีไม่เกิน 50 ตัวอักษร'

  // รายละเอียด: ว่างได้แต่จำกัดความยาว
  if (form.value.description.trim().length > 2000) errs.description = 'รายละเอียดไม่เกิน 2000 ตัวอักษร'

  return errs
}

// บันทึกฟอร์ม: เพิ่มสินค้าใหม่ หรืออัปเดตสินค้าเดิม
async function save() {
  const errs = validate()
  errors.value = errs
  if (Object.values(errs).some(Boolean)) {
    toast('กรุณาแก้ไขช่องที่มีเครื่องหมายสีแดง', 'error')
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
      await updateProduct(route.params.id, payload)
      toast('บันทึกการแก้ไขสินค้าแล้ว')
    } else {
      await createProduct({ ...payload, seller_id: auth.user.id })
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
      <PageHeader :title="isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'" :subtitle="'กรอกข้อมูลสินค้าที่ต้องการ' + (isEdit ? 'แก้ไข' : 'ลงขาย')" />
    </div>

    <form v-if="!loading" class="space-y-5 rounded-2xl border border-stone-200 bg-white p-6" @input="errors = {}" @submit.prevent="save">
      <ImageUploader v-model="form.image" :owner-id="auth.user.id" />

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <FormInput v-model="form.product_name" name="product-name" label="ชื่อสินค้า" required maxlength="100" :error="errors.product_name" />
        </div>
        <FormInput v-model="form.price" name="price" label="ราคา (บาท)" type="number" min="0" step="0.01" maxlength="9" required :error="errors.price" />
        <FormInput v-model="form.quantity" name="quantity" label="จำนวน (สต็อก)" type="number" min="0" maxlength="6" required :error="errors.quantity" />
        <FormInput v-model="form.category" name="category" label="หมวดหมู่" placeholder="เช่น เสื้อผ้า" maxlength="50" :suggestions="PRODUCT_CATEGORIES" :error="errors.category" />
        <FormInput v-model="form.size" name="size" label="ไซส์" placeholder="เช่น M" maxlength="50" :suggestions="PRODUCT_SIZES" :error="errors.size" />
        <FormInput v-model="form.color" name="color" label="สี" placeholder="เช่น Black" maxlength="50" :suggestions="PRODUCT_COLORS" :error="errors.color" />
      </div>

      <FormTextarea v-model="form.description" label="รายละเอียดสินค้า" rows="4" maxlength="2000" :error="errors.description" />

      <div class="flex justify-end gap-3">
        <button type="button" class="rounded-full border border-stone-300 px-6 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
          @click="router.push({ name: 'seller-products' })">
          ยกเลิก
        </button>
        <button type="submit" :disabled="saving"
          class="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          {{ isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า' }}
        </button>
      </div>
    </form>
  </div>
</template>