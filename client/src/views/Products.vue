<template>
  <div class="products">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加产品
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索产品名称或描述"
          :prefix-icon="Search"
          clearable
          style="width: 250px; margin-right: 16px;"
          @input="handleSearch"
        />
        
        <el-select
          v-model="filterCategory"
          placeholder="选择分类"
          clearable
          style="width: 150px; margin-right: 16px;"
          @change="handleFilter"
        >
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        
        <el-select
          v-model="filterStatus"
          placeholder="选择状态"
          clearable
          style="width: 120px;"
          @change="handleFilter"
        >
          <el-option label="活跃" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>
      </div>
    </div>

    <!-- 产品表格 -->
    <div class="card">
      <el-table
        :data="filteredProducts"
        :loading="loading"
        style="width: 100%"
        empty-text="暂无产品数据"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="产品名称" min-width="180" sortable>
          <template #default="{ row }">
            <div class="product-cell">
              <div class="product-name">{{ row.name }}</div>
              <div class="product-description">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="分类" width="120" sortable>
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small" type="info">
              {{ row.category }}
            </el-tag>
            <span v-else class="text-muted">未分类</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="purchase_date" label="购买日期" width="120" sortable>
          <template #default="{ row }">
            {{ formatDate(row.purchase_date) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="expiry_date" label="到期日期" width="120" sortable>
          <template #default="{ row }">
            <span :class="getExpiryClass(row)">
              {{ formatDate(row.expiry_date) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余天数" width="100" sortable="custom">
          <template #default="{ row }">
            <span :class="getDaysClass(row.daysUntilExpiry)">
              {{ row.daysUntilExpiry }}天
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getProductStatus(row).type" size="small">
              {{ getProductStatus(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="price" label="价格" width="100" sortable>
          <template #default="{ row }">
            {{ formatPrice(row.price) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="supplier" label="供应商" width="120" />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editProduct(row)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="sendNotification(row.id)"
              :loading="sendingNotification[row.id]"
            >
              通知
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteProduct(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑产品' : '添加产品'"
      width="600px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <div class="form-section">
          <div class="form-section-title">基本信息</div>
          
          <el-form-item label="产品名称" prop="name">
            <el-input
              v-model="productForm.name"
              placeholder="请输入产品名称"
              clearable
            />
          </el-form-item>
          
          <el-form-item label="产品描述" prop="description">
            <el-input
              v-model="productForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入产品描述"
            />
          </el-form-item>
          
          <el-form-item label="产品分类" prop="category">
            <el-select
              v-model="productForm.category"
              placeholder="请选择分类"
              filterable
              allow-create
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>
        </div>
        
        <div class="form-section">
          <div class="form-section-title">日期信息</div>
          
          <el-form-item label="购买日期" prop="purchase_date">
            <el-date-picker
              v-model="productForm.purchase_date"
              type="date"
              placeholder="选择购买日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="到期日期" prop="expiry_date">
            <el-date-picker
              v-model="productForm.expiry_date"
              type="date"
              placeholder="选择到期日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="提醒天数" prop="reminder_days">
            <el-input-number
              v-model="productForm.reminder_days"
              :min="1"
              :max="365"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-tip">在到期前多少天开始提醒</div>
          </el-form-item>
        </div>
        
        <div class="form-section">
          <div class="form-section-title">其他信息</div>
          
          <el-form-item label="价格" prop="price">
            <el-input-number
              v-model="productForm.price"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="供应商" prop="supplier">
            <el-input
              v-model="productForm.supplier"
              placeholder="请输入供应商名称"
              clearable
            />
          </el-form-item>
          
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="productForm.status">
              <el-radio label="active">活跃</el-radio>
              <el-radio label="inactive">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="submitForm"
          >
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import {
  formatDate,
  formatPrice,
  getProductStatus,
  debounce
} from '@/utils/helpers'
import {
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const isEdit = ref(false)
const products = ref([])
const categories = ref([])
const sendingNotification = ref({})

// 搜索和过滤
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表单
const productFormRef = ref()
const productForm = reactive({
  name: '',
  description: '',
  category: '',
  purchase_date: '',
  expiry_date: '',
  price: 0,
  supplier: '',
  status: 'active',
  reminder_days: 7
})

// 表单验证规则
const productRules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '产品名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  expiry_date: [
    { required: true, message: '请选择到期日期', trigger: 'change' }
  ],
  reminder_days: [
    { required: true, message: '请输入提醒天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 365, message: '提醒天数必须在 1-365 之间', trigger: 'blur' }
  ]
}

// 计算属性
const filteredProducts = computed(() => {
  let result = [...products.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    )
  }
  
  // 分类过滤
  if (filterCategory.value) {
    result = result.filter(product => product.category === filterCategory.value)
  }
  
  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(product => product.status === filterStatus.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 监听过滤结果的长度变化
watch(() => {
  let result = [...products.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    )
  }
  
  if (filterCategory.value) {
    result = result.filter(product => product.category === filterCategory.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(product => product.status === filterStatus.value)
  }
  
  return result.length
}, (newTotal) => {
  total.value = newTotal
})

// 方法
const loadProducts = async () => {
  try {
    loading.value = true
    const response = await api.get('/products')
    products.value = response.data
    
    // 提取所有分类
    const categorySet = new Set()
    products.value.forEach(product => {
      if (product.category) {
        categorySet.add(product.category)
      }
    })
    categories.value = Array.from(categorySet)
    
  } catch (error) {
    console.error('加载产品失败:', error)
    ElMessage.error('加载产品失败')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadProducts()
  ElMessage.success('数据已刷新')
}

const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

const handleFilter = () => {
  currentPage.value = 1
}

const handleSortChange = ({ column, prop, order }) => {
  // 实现排序逻辑
  if (!order) return
  
  products.value.sort((a, b) => {
    let aVal = a[prop]
    let bVal = b[prop]
    
    if (prop === 'daysUntilExpiry') {
      aVal = a.daysUntilExpiry || 0
      bVal = b.daysUntilExpiry || 0
    }
    
    if (order === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const editProduct = (product) => {
  isEdit.value = true
  showAddDialog.value = true
  
  // 填充表单数据
  Object.keys(productForm).forEach(key => {
    productForm[key] = product[key] || ''
  })
  productForm.id = product.id
}

const resetForm = () => {
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
  
  Object.keys(productForm).forEach(key => {
    if (key === 'status') {
      productForm[key] = 'active'
    } else if (key === 'reminder_days') {
      productForm[key] = 7
    } else if (key === 'price') {
      productForm[key] = 0
    } else {
      productForm[key] = ''
    }
  })
  
  isEdit.value = false
}

const submitForm = async () => {
  if (!productFormRef.value) return
  
  await productFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEdit.value) {
        await api.put(`/products/${productForm.id}`, productForm)
        ElMessage.success('产品更新成功')
      } else {
        await api.post('/products', productForm)
        ElMessage.success('产品添加成功')
      }
      
      showAddDialog.value = false
      await loadProducts()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    } finally {
      submitting.value = false
    }
  })
}

const deleteProduct = (product) => {
  ElMessageBox.confirm(
    `确定要删除产品"${product.name}"吗？此操作不可撤销。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await api.delete(`/products/${product.id}`)
      ElMessage.success('删除成功')
      await loadProducts()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const sendNotification = async (productId) => {
  try {
    sendingNotification.value[productId] = true
    
    const response = await api.post(`/notifications/send/${productId}`)
    
    if (response.data.success) {
      ElMessage.success('通知发送成功')
    } else {
      ElMessage.error(response.data.message || '通知发送失败')
    }
  } catch (error) {
    console.error('发送通知失败:', error)
    ElMessage.error('通知发送失败')
  } finally {
    sendingNotification.value[productId] = false
  }
}

const getExpiryClass = (product) => {
  if (product.isExpired) return 'text-danger'
  if (product.isExpiringSoon) return 'text-warning'
  return ''
}

const getDaysClass = (days) => {
  if (days < 0) return 'text-danger'
  if (days <= 7) return 'text-warning'
  return 'text-success'
}

// 生命周期
onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.products {
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.card {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.product-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-8);
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
  
  .toolbar-right {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .toolbar-right .el-input,
  .toolbar-right .el-select {
    width: 100% !important;
    max-width: none !important;
  }
}
</style>