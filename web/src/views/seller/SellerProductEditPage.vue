<script setup>
// หน้าเพิ่ม/แก้ไขสินค้าของผู้ขาย (ใช้เส้นทางเดียวกัน - ดูจาก params.id ว่าเป็นโหมดไหน)
// สินค้า 1 ชิ้นมีได้หลายตัวเลือก (variant: ไซส์/สี + สต็อกแยกกัน) จัดการเพิ่ม/ลบในหน้านี้ที่เดียว
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductBySeller, createProduct, updateProduct } from '@/api/products'
import { listVariantsByProduct, createVariant, updateVariant, deleteVariant } from '@/api/variants'
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
// true ขณะรูปกำลังอัปโหลด (รับจาก ImageUploader) ใช้ปิดปุ่มบันทึกกันกดเซฟก่อนรูปเสร็จ
const imageUploading = ref(false)

const form = ref({
  product_name: '',
  price: '',
  category: '',
  description: '',
  image: '',
})

// ตัวเลือกสินค้า (variants): แถวที่มี variant_id คือของเดิมใน DB, ไม่มีคือแถวใหม่
// _delete = หมายเหตุลบไว้ก่อน ลบจริงตอนกดบันทึกสินค้า
const variants = ref([])
const newVariant = ref({ size: '', color: '', quantity: '' })
const variantError = ref('')
const MAX_VARIANTS = 20

let rowSeq = 0
function blankVariant() {
  rowSeq += 1
  return { _key: `row-${rowSeq}`, variant_id: null, size: '', color: '', quantity: '', _delete: false }
}

// โหลดข้อมูลเดิม + variants มาใส่ฟอร์มเมื่อแก้ไข (เช็กด้วยว่าเป็นสินค้าของเราจริง)
async function load() {
  if (!isEdit.value) {
    // สินค้าใหม่: เริ่มด้วยแถวว่าง 1 แถวให้กรอกได้ทันที
    variants.value = [blankVariant()]
    return
  }
  loading.value = true
  try {
    const data = await getProductBySeller(route.params.id, auth.user.id)
    if (!data) {
      form.value = { product_name: '', price: '', category: '', description: '', image: '' }
      variants.value = []
      return
    }
    form.value = {
      product_name: data.product_name || '',
      price: data.price,
      category: data.category || '',
      description: data.description || '',
      image: data.image || '',
    }
    const rows = await listVariantsByProduct(route.params.id)
    variants.value = rows.map((v) => ({
      _key: `db-${v.variant_id}`,
      variant_id: v.variant_id,
      size: v.size || '',
      color: v.color || '',
      quantity: v.quantity,
      _delete: false,
    }))
  } catch (e) {
    // ไม่เจอสินค้า = ฟอร์มว่าง ให้ผู้ใช้กลับไปหน้าจัดการ
  } finally {
    loading.value = false
  }
}

// เพิ่ม variant ลงตาราง (แถวใหม่จะถูกสร้างจริงตอนกดบันทึกสินค้า)
function addVariant() {
  variantError.value = ''
  const size = newVariant.value.size.trim()
  const color = newVariant.value.color.trim()
  const qty = String(newVariant.value.quantity).trim()
  if (!size || !color) { variantError.value = 'กรุณากรอกไซส์และสี'; return }
  if (size.length > 50 || color.length > 50) { variantError.value = 'ไซส์/สีต้องไม่เกิน 50 ตัวอักษร'; return }
  if (!qty) { variantError.value = 'กรุณากรอกสต็อก'; return }
  if (!isNonNegativeInt(qty)) { variantError.value = 'สต็อกต้องเป็นเลขจำนวนเต็มไม่ติดลบ'; return }
  if (Number(qty) > 999999) { variantError.value = 'สต็อกสูงเกินไป'; return }
  const dup = variants.value.some(
    (v) => !v._delete
      && String(v.size).trim().toLowerCase() === size.toLowerCase()
      && String(v.color).trim().toLowerCase() === color.toLowerCase()
  )
  if (dup) { variantError.value = 'มีไซส์/สีนี้อยู่แล้ว'; return }
  if (variants.value.filter((v) => !v._delete).length >= MAX_VARIANTS) {
    variantError.value = `เพิ่มได้สูงสุด ${MAX_VARIANTS} แบบ`
    return
  }
  const row = blankVariant()
  row.size = size
  row.color = color
  row.quantity = Number(qty)
  variants.value.push(row)
  newVariant.value = { size: '', color: '', quantity: '' }
}

// หมายเหตุลบ variant (แถวใหม่ลบออกจากตารางทันที ของเดิมลบจริงตอนกดบันทึก)
function markDeleteVariant(idx) {
  const v = variants.value[idx]
  if (v.variant_id) v._delete = true
  else variants.value.splice(idx, 1)
}

function undoDeleteVariant(idx) {
  variants.value[idx]._delete = false
}

// ตรวจรูปแบบข้อมูลก่อนบันทึก; คืน error รายช่อง (ช่องไหนผ่าน = เป็น "")
function validate() {
  const errs = {}
  const name = form.value.product_name.trim()
  const price = String(form.value.price).trim()

  // ชื่อสินค้า: ต้องมี ไม่ยาวเกิน และไม่ขึ้นต้นด้วยเว้นวรรค
  if (!name) errs.product_name = 'กรุณากรอกชื่อสินค้า'
  else if (name.length > 100) errs.product_name = 'ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร'

  // ราคา: ตัวเลขเท่านั้น ไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง (กัน abc/e/เครื่องหมาย)
  if (!price) errs.price = 'กรุณากรอกราคา'
  else if (!isValidPrice(price)) errs.price = 'ราคาต้องเป็นตัวเลข เช่น 250 หรือ 250.50 เท่านั้น'
  else if (Number(price) > 9999999) errs.price = 'ราคาสูงเกินไป'

  // หมวดหมู่: ว่างได้แต่จำกัดความยาว
  if (form.value.category.trim().length > 50) errs.category = 'หมวดหมู่ไม่เกิน 50 ตัวอักษร'

  // รูปสินค้า: บังคับใส่ทุกครั้งทั้งเพิ่มและแก้ไข
  if (!form.value.image.trim()) errs.image = 'กรุณาอัปโหลดรูปสินค้าทุกครั้ง'

  // รายละเอียด: ว่างได้แต่จำกัดความยาว
  if (form.value.description.trim().length > 2000) errs.description = 'รายละเอียดไม่เกิน 2000 ตัวอักษร'

  // ตัวเลือกสินค้า: ต้องมีอย่างน้อย 1 แบบ ทุกแบบต้องมีไซส์/สี/สต็อกที่ถูกต้องและไม่ซ้ำ
  const active = variants.value.filter((v) => !v._delete)
  if (!active.length) {
    errs.variants = 'กรุณาเพิ่มตัวเลือกสินค้าอย่างน้อย 1 แบบ (ไซส์/สี/สต็อก)'
  } else {
    const seen = new Set()
    for (const v of active) {
      const size = String(v.size ?? '').trim()
      const color = String(v.color ?? '').trim()
      const qty = String(v.quantity ?? '').trim()
      if (!size || !color) { errs.variants = 'ทุกตัวเลือกต้องมีไซส์และสี'; break }
      if (size.length > 50 || color.length > 50) { errs.variants = 'ไซส์/สีต้องไม่เกิน 50 ตัวอักษร'; break }
      if (!qty) { errs.variants = 'ทุกตัวเลือกต้องมีสต็อก'; break }
      if (!isNonNegativeInt(qty)) { errs.variants = 'สต็อกต้องเป็นเลขจำนวนเต็มไม่ติดลบ'; break }
      if (Number(qty) > 999999) { errs.variants = 'สต็อกสูงเกินไป'; break }
      const key = size.toLowerCase() + '|' + color.toLowerCase()
      if (seen.has(key)) { errs.variants = 'มีไซส์/สีซ้ำกัน'; break }
      seen.add(key)
    }
  }

  return errs
}

// บันทึกฟอร์ม: เพิ่มสินค้าใหม่ หรืออัปเดตสินค้าเดิม พร้อม sync variants
async function save() {
  const errs = validate()
  errors.value = errs
  if (Object.values(errs).some(Boolean)) {
    toast('กรุณาแก้ไขช่องที่มีเครื่องหมายสีแดง', 'error')
    return
  }
  saving.value = true
  let productId = route.params.id
  try {
    const payload = {
      product_name: form.value.product_name.trim(),
      price: Number(form.value.price),
      category: form.value.category.trim() || null,
      description: form.value.description.trim() || null,
      image: form.value.image.trim(),
    }
    if (isEdit.value) {
      await updateProduct(productId, payload)
    } else {
      // ยอดรวมสต็อกจะถูก trigger ปรับให้เองหลังสร้าง variants
      productId = await createProduct({ ...payload, quantity: 0, seller_id: auth.user.id })
    }

    for (const v of variants.value) {
      if (v.variant_id && v._delete) {
        await deleteVariant(v.variant_id)
      } else if (v.variant_id) {
        await updateVariant(v.variant_id, {
          size: String(v.size).trim(),
          color: String(v.color).trim(),
          quantity: Number(String(v.quantity).trim()),
        })
      } else {
        await createVariant({
          productId,
          size: String(v.size).trim(),
          color: String(v.color).trim(),
          quantity: Number(String(v.quantity).trim()),
        })
      }
    }

    toast(isEdit.value ? 'บันทึกการแก้ไขสินค้าแล้ว' : 'เพิ่มสินค้าสำเร็จ!')
    router.push({ name: 'seller-products' })
  } catch (e) {
    if (!isEdit.value && productId && productId !== route.params.id) {
      // ตัวสินค้าถูกสร้างแล้วแต่ variants ไม่ครบ ให้ไปต่อที่หน้าแก้ไขแทนการเริ่มใหม่
      toast('สร้างสินค้าแล้ว แต่บันทึกตัวเลือกไม่ครบ กรุณาตรวจสอบ', 'error')
      router.push({ name: 'seller-product-edit', params: { id: productId } })
    } else {
      toast(e?.message || 'บันทึกไม่สำเร็จ', 'error')
    }
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
      <ImageUploader v-model="form.image" :owner-id="auth.user.id" required :error="errors.image" @update:uploading="imageUploading = $event" />

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <FormInput v-model="form.product_name" name="product-name" label="ชื่อสินค้า" required maxlength="100" :error="errors.product_name" />
        </div>
        <FormInput v-model="form.price" name="price" label="ราคา (บาท)" type="number" min="0" step="0.01" maxlength="9" required :error="errors.price" />
        <FormInput v-model="form.category" name="category" label="หมวดหมู่" placeholder="เช่น เสื้อผ้า" maxlength="50" :suggestions="PRODUCT_CATEGORIES" :error="errors.category" />
      </div>

      <!-- ตัวเลือกสินค้า (variants): เพิ่ม/แก้/ลบ ไซส์-สี พร้อมสต็อกแยกกัน -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium text-stone-600">
            ตัวเลือกสินค้า (ไซส์ / สี / สต็อก)<span class="text-red-500"> *</span>
          </label>
          <span class="text-xs text-stone-400">สต็อกแยกกันตามแต่ละแบบ</span>
        </div>

        <div v-if="variants.length" class="space-y-2">
          <div v-for="(v, idx) in variants" :key="v._key"
            class="flex items-center gap-2 rounded-xl border px-3 py-2"
            :class="v._delete ? 'border-red-200 bg-red-50/50' : 'border-stone-200'">
            <input v-model="v.size" :list="'dl-size-' + v._key" placeholder="ไซส์" maxlength="50"
              :disabled="v._delete" @input="variantError = ''"
              class="w-full min-w-0 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:bg-stone-100" />
            <input v-model="v.color" :list="'dl-color-' + v._key" placeholder="สี" maxlength="50"
              :disabled="v._delete" @input="variantError = ''"
              class="w-full min-w-0 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:bg-stone-100" />
            <input v-model="v.quantity" inputmode="numeric" placeholder="สต็อก" maxlength="6"
              :disabled="v._delete" @input="variantError = ''"
              class="w-24 shrink-0 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-400 disabled:bg-stone-100" />
            <button v-if="!v._delete" type="button" title="ลบตัวเลือกนี้"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-600"
              @click="markDeleteVariant(idx)">
              <Icon name="trash" :size="16" />
            </button>
            <button v-else type="button" title="ยกเลิกการลบ"
              class="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              @click="undoDeleteVariant(idx)">
              เลิกทำ
            </button>
            <datalist :id="'dl-size-' + v._key">
              <option v-for="s in PRODUCT_SIZES" :key="s" :value="s" />
            </datalist>
            <datalist :id="'dl-color-' + v._key">
              <option v-for="c in PRODUCT_COLORS" :key="c" :value="c" />
            </datalist>
          </div>
        </div>
        <p v-else class="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-500">ยังไม่มีตัวเลือก กด “+ เพิ่ม” ด้านล่างเพื่อสร้างแบบแรก</p>

        <div class="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input v-model="newVariant.size" list="dl-new-size" placeholder="ไซส์ เช่น M" maxlength="50"
            @input="variantError = ''"
            class="w-full min-w-0 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <input v-model="newVariant.color" list="dl-new-color" placeholder="สี เช่น Black" maxlength="50"
            @input="variantError = ''"
            class="w-full min-w-0 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <input v-model="newVariant.quantity" inputmode="numeric" placeholder="สต็อก" maxlength="6"
            @input="variantError = ''"
            class="w-full min-w-0 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <button type="button"
            class="flex shrink-0 items-center gap-1 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            @click="addVariant">
            <Icon name="plus" :size="16" /> เพิ่ม
          </button>
        </div>
        <datalist id="dl-new-size">
          <option v-for="s in PRODUCT_SIZES" :key="s" :value="s" />
        </datalist>
        <datalist id="dl-new-color">
          <option v-for="c in PRODUCT_COLORS" :key="c" :value="c" />
        </datalist>
        <p v-if="variantError" class="mt-1 text-xs text-red-500">{{ variantError }}</p>
        <p v-if="errors.variants" class="mt-1 text-xs text-red-500">{{ errors.variants }}</p>
      </div>

      <FormTextarea v-model="form.description" label="รายละเอียดสินค้า" rows="4" maxlength="2000" :error="errors.description" />

      <div class="flex justify-end gap-3">
        <button type="button" class="rounded-full border border-stone-300 px-6 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
          @click="router.push({ name: 'seller-products' })">
          ยกเลิก
        </button>
        <button type="submit" :disabled="saving || imageUploading"
          class="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          {{ isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า' }}
        </button>
      </div>
    </form>
  </div>
</template>