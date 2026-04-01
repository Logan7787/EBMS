import { useState, useRef } from 'react'
import { X, Download, Upload, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import Papa from 'papaparse'
import { supabase, supabaseCreator } from '../../lib/supabase'
import { toast } from 'sonner'

interface BulkEmployeeUploadProps {
  onClose: () => void
  onComplete: () => void
}

interface UploadRow {
  empCode: string
  name: string
  email: string
  password?: string
  designation: string
  site: string
  battaAmount: number
  role: 'Employee' | 'Manager' | 'HR'
  managerEmpCode?: string
  grade?: string
  catgCode?: string
  gradeCode?: string
}

interface UploadStatus {
  row: number
  empCode: string
  name: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
}

export default function BulkEmployeeUpload({ onClose, onComplete }: BulkEmployeeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<UploadStatus[]>([])
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Password',
      'Designation',
      'Site',
      'Batta Rate',
      'Role',
      'Reporting Manager Code',
      'Grade',
      'Category Code',
      'Grade Code'
    ]
    const example = [
      '1001',
      'John Doe',
      'john.doe@example.com',
      'Welcome@123',
      'Supervisor',
      'BO',
      '500',
      'Employee',
      '1000',
      'G1',
      'CAT-A',
      'GC-01'
    ]
    const csvContent = Papa.unparse([headers, example])
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'employee_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[]
        const formattedData: UploadRow[] = data.map((row: any) => ({
          empCode: row['Employee Code'] || '',
          name: row['Name'] || '',
          email: row['Email'] || '',
          password: row['Password'] || '',
          designation: row['Designation'] || '',
          site: row['Site'] || '',
          battaAmount: parseFloat(row['Batta Rate']) || 0,
          role: row['Role'] || 'Employee',
          managerEmpCode: row['Reporting Manager Code'] || '',
          grade: row['Grade'] || '',
          catgCode: row['Category Code'] || '',
          gradeCode: row['Grade Code'] || ''
        }))

        // Basic validation
        const initialStatus: UploadStatus[] = formattedData.map((d, i) => ({
          row: i + 1,
          empCode: d.empCode,
          name: d.name,
          status: 'pending'
        }))

        setResults(initialStatus)
        await processUploads(formattedData)
      }
    })
  }

  const processUploads = async (data: UploadRow[]) => {
    setIsProcessing(true)
    let completed = 0

    // Get all potential managers to map empCode to ID
    const { data: managers } = await supabase
      .from('users')
      .select('id, emp_code')
      .in('role', ['Manager', 'HR'])

    const managerMap = new Map<string, string>((managers || []).map(m => [m.emp_code, m.id]))

    for (let i = 0; i < data.length; i++) {
        const rowData = data[i]
        setResults(prev => prev.map((res, idx) => 
            idx === i ? { ...res, status: 'processing' } : res
        ))

        try {
            // 1. Check if user already exists by empCode
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, email')
                .eq('emp_code', rowData.empCode)
                .single()

            const managerId = rowData.managerEmpCode ? managerMap.get(rowData.managerEmpCode) : null

            const userData = {
                emp_code: rowData.empCode,
                name: rowData.name,
                role: rowData.role,
                designation: rowData.designation,
                site: rowData.site,
                batta_amount: rowData.battaAmount,
                manager_id: managerId,
                active: true,
                grade: rowData.grade,
                catg_code: rowData.catgCode,
                grade_code: rowData.gradeCode
            }

            if (existingUser) {
                // Update existing user
                const { error: updateError } = await supabase
                    .from('users')
                    .update(userData)
                    .eq('id', existingUser.id)
                
                if (updateError) throw updateError
            } else {
                // Create new user
                if (!rowData.email || !rowData.name || !rowData.empCode) {
                    throw new Error('Missing required fields for new user (Email, Name, or Emp Code)')
                }
                if (!rowData.password || rowData.password.length < 6) {
                    throw new Error('Password min 6 characters required for new users')
                }

                const { data: authData, error: authError } = await supabaseCreator.auth.signUp({
                    email: rowData.email,
                    password: rowData.password,
                })

                if (authError) throw authError
                if (!authData.user) throw new Error('Auth creation failed')

                // The trigger handle_new_user creates the profile, we just update it
                const { error: updateError } = await supabase
                    .from('users')
                    .update(userData)
                    .eq('id', authData.user.id)

                if (updateError) throw updateError
            }

            setResults(prev => prev.map((res, idx) => 
                idx === i ? { ...res, status: 'success' } : res
            ))
        } catch (error: any) {
            console.error(`Error processing row ${i + 1}:`, error)
            setResults(prev => prev.map((res, idx) => 
                idx === i ? { ...res, status: 'error', message: error.message || 'Unknown error' } : res
            ))
        }

        completed++
        setProgress(Math.round((completed / data.length) * 100))
    }

    setIsProcessing(false)
    onComplete()
    toast.success('Bulk upload process completed')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bulk Employee Upload</h2>
            <p className="text-sm text-slate-500">Upload multiple employees via CSV template</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!results.length ? (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
                <Info className="text-indigo-600 shrink-0" size={20} />
                <div className="text-sm text-indigo-900">
                  <p className="font-semibold mb-1">Before you start:</p>
                  <ul className="list-disc list-inside space-y-1 text-indigo-800/80">
                    <li>Download the template and fill in the employee details.</li>
                    <li><strong>Employee Code</strong> must be unique.</li>
                    <li><strong>Email</strong> must be unique and valid.</li>
                    <li><strong>Password</strong> must be at least 6 characters.</li>
                    <li><strong>Reporting Manager Code</strong> should match an existing Manager/HR code.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={downloadTemplate}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
                    <Download className="text-slate-600 group-hover:text-indigo-600" size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-slate-900">Download Template</span>
                    <span className="text-xs text-slate-500">Get the CSV sample file</span>
                  </div>
                </button>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <div className="p-3 bg-slate-100 rounded-full group-hover:bg-emerald-100 transition-colors">
                    <Upload className="text-slate-600 group-hover:text-emerald-600" size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-slate-900">Upload File</span>
                    <span className="text-xs text-slate-500">Click to select CSV file</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Upload Progress</h3>
                <span className="text-sm font-medium text-slate-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="max-height-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                {results.map((res, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-mono text-slate-400 w-6">#{res.row}</div>
                        <div>
                            <div className="text-sm font-medium text-slate-900">{res.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{res.empCode || 'No Code'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {res.status === 'processing' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                        {res.status === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {res.status === 'error' && (
                            <div className="flex items-center gap-1.5 text-red-500" title={res.message}>
                                <AlertCircle size={16} />
                                <span className="text-xs font-medium">Failed</span>
                            </div>
                        )}
                        {res.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                    </div>
                  </div>
                ))}
              </div>

              {!isProcessing && (
                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                    >
                        Done
                    </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
