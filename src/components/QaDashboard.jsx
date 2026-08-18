import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { getQaDashboard } from '../api/dashboard'
import { getFactories, getAllStaff } from '../api/master'
import { useLanguage } from '../i18n/LanguageContext'

const FILTER_INPUT_CLASS =
  'w-full bg-white text-slate-800 border border-slate-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy'

// Đồng bộ với STAGE_OPTIONS trong GeneralInfoCard.jsx (danh sách khâu kiểm của ticket).
const STAGE_OPTIONS = [
  { value: 'FIRST_OUTPUT', label: 'First Output' },
  { value: 'INLINE', label: 'Inline' },
  { value: 'ENDLINE', label: 'Endline' },
  { value: 'PREFINAL', label: 'Prefinal' },
  { value: 'FINAL', label: 'Final' },
  { value: 'PACKING', label: 'Packing' },
]

// Màu lấy từ bảng categorical palette đã kiểm định (xem dataviz skill) - dùng
// đúng thứ tự slot 1..5 cho 5 card, giữ nguyên hex, không tự chế màu mới.
const CARD_BORDER_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const LINE_COLOR = '#2a78d6' // slot 1 - blue
const PARETO_BAR_COLOR = '#2a78d6' // slot 1 - blue
const PARETO_LINE_COLOR = '#e34948' // slot 8 - red (theo yêu cầu: line % tích luỹ màu đỏ)
const COLUMN_BAR_COLOR = '#008300' // slot 6 - green (theo yêu cầu: cột xanh lá)
const GRID_COLOR = '#e1e0d9'
const AXIS_LINE_COLOR = '#c3c2b7'
const TICK_COLOR = '#898781'
const TICK_STYLE = { fontSize: 12, fill: TICK_COLOR }

function InspectionsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}

function TrendIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

function ParetoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20V10M10 20V4M16 20V13" />
      <path d="M4 8l6-3 6 5 4-4" />
    </svg>
  )
}

function ColumnsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20V12M10 20V6M16 20V14M22 20H2" />
    </svg>
  )
}

function BlockPanel({ number, icon, title, extra, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 shrink-0 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">
            {number}
          </span>
          {icon}
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">{title}</h2>
        </div>
        {extra}
      </div>
      {children}
    </div>
  )
}

function EmptyState() {
  const { t } = useLanguage()
  return <p className="text-sm text-slate-400 text-center py-10">{t('Chưa có dữ liệu')}</p>
}

export default function QaDashboard({ userInfo }) {
  const { t } = useLanguage()
  const isAdmin = userInfo?.role === 'ADMIN'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [factoryOptions, setFactoryOptions] = useState([])
  const [staffOptions, setStaffOptions] = useState([])
  const [filters, setFilters] = useState({ staffId: '', factoryId: '', stage: '' })

  useEffect(() => {
    getFactories()
      .then((list) => setFactoryOptions(list.map((f) => ({ value: f.id, label: f.name }))))
      .catch(() => {})
    // Nhân viên thường chỉ xem dữ liệu của mình (BE tự scope) nên không cần lọc
    // theo nhân viên - chỉ admin mới thấy/lọc được theo tất cả nhân viên.
    if (isAdmin) {
      getAllStaff()
        .then((list) => setStaffOptions(list.map((s) => ({ value: s.id, label: s.fullName }))))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    getQaDashboard({
      staffId: filters.staffId || undefined,
      factoryId: filters.factoryId || undefined,
      inspectionStage: filters.stage || undefined,
    })
      .then(setData)
      .catch((err) => setError(err.message || t('Không tải được dữ liệu dashboard')))
      .finally(() => setLoading(false))
  }, [filters.staffId, filters.factoryId, filters.stage])

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const stageSummary = data?.stageSummary || []
  const dhuTimeline = data?.dhuTimeline || []
  const paretoDefectGroups = data?.paretoDefectGroups || []
  const dhuByStage = data?.dhuByStage || []

  return (
    <div className="min-h-screen py-6 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-lg font-bold text-slate-800 mb-3">{t('Thống kê QA')}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Nhà máy')}</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.factoryId}
                onChange={(e) => updateFilter('factoryId', e.target.value)}
              >
                <option value="">{t('Tất cả')}</option>
                {factoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Nhân viên')}</label>
                <select
                  className={FILTER_INPUT_CLASS}
                  value={filters.staffId}
                  onChange={(e) => updateFilter('staffId', e.target.value)}
                >
                  <option value="">{t('Tất cả')}</option>
                  {staffOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Khâu kiểm tra')}</label>
              <select
                className={FILTER_INPUT_CLASS}
                value={filters.stage}
                onChange={(e) => updateFilter('stage', e.target.value)}
              >
                <option value="">{t('Tất cả')}</option>
                {STAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-brand-red text-brand-red text-sm rounded-md p-3">
            {error}
          </div>
        )}
        {loading && <p className="text-sm text-slate-400">{t('Đang tải...')}</p>}

        {!loading && data && (
          <>
            {/* Khối 1 - Card số lượt kiểm theo khâu */}
            <BlockPanel
              number={1}
              icon={<InspectionsIcon className="w-4 h-4 text-brand-navy" />}
              title={t('Số lượt kiểm theo khâu')}
              extra={
                <span className="text-xs text-slate-400">
                  {t('Tổng số lượt kiểm:')} <span className="font-semibold text-slate-600">{data.totalInspections ?? 0}</span>
                </span>
              }
            >
              {stageSummary.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {stageSummary.map((s, i) => (
                    <div
                      key={s.stage}
                      className="rounded-lg border-t-4 bg-slate-50 px-3 py-3"
                      style={{ borderTopColor: CARD_BORDER_COLORS[i % CARD_BORDER_COLORS.length] }}
                    >
                      <p className="text-xs font-medium text-slate-500 truncate">{s.label}</p>
                      <p className="text-2xl font-extrabold text-slate-800 mt-1">{s.count}</p>
                      <p className="text-[11px] text-slate-400">{t('lần kiểm')}</p>
                    </div>
                  ))}
                </div>
              )}
            </BlockPanel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Khối 2 - Line chart DHU% theo ngày */}
              <BlockPanel
                number={2}
                icon={<TrendIcon className="w-4 h-4 text-brand-navy" />}
                title={t('Tỉ lệ DHU (%) theo ngày')}
              >
                {dhuTimeline.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dhuTimeline} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={TICK_STYLE}
                          axisLine={{ stroke: AXIS_LINE_COLOR }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={TICK_STYLE}
                          axisLine={{ stroke: AXIS_LINE_COLOR }}
                          tickLine={false}
                          unit="%"
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_COLOR }}
                          formatter={(value) => [`${value}%`, t('Tỉ lệ DHU')]}
                        />
                        <Line
                          type="monotone"
                          dataKey="dhuPercent"
                          name={t('Tỉ lệ DHU (%)')}
                          stroke={LINE_COLOR}
                          strokeWidth={2}
                          dot={{ r: 4, fill: LINE_COLOR }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </BlockPanel>

              {/* Khối 3 - Pareto chart: số lượng lỗi (bar) + % tích luỹ (line) */}
              <BlockPanel
                number={3}
                icon={<ParetoIcon className="w-4 h-4 text-brand-navy" />}
                title={t('Pareto nhóm lỗi')}
              >
                {paretoDefectGroups.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={paretoDefectGroups} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                        <XAxis
                          dataKey="groupName"
                          tick={TICK_STYLE}
                          axisLine={{ stroke: AXIS_LINE_COLOR }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={TICK_STYLE}
                          axisLine={{ stroke: AXIS_LINE_COLOR }}
                          tickLine={false}
                          width={36}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={TICK_STYLE}
                          axisLine={{ stroke: AXIS_LINE_COLOR }}
                          tickLine={false}
                          unit="%"
                          domain={[0, 100]}
                          width={40}
                        />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_COLOR }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                          yAxisId="left"
                          dataKey="defectCount"
                          name={t('Số lượng lỗi')}
                          fill={PARETO_BAR_COLOR}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumulativePercent"
                          name={t('% tích luỹ')}
                          stroke={PARETO_LINE_COLOR}
                          strokeWidth={2}
                          dot={{ r: 4, fill: PARETO_LINE_COLOR }}
                          activeDot={{ r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </BlockPanel>
            </div>

            {/* Khối 4 - Column chart DHU% theo khâu */}
            <BlockPanel
              number={4}
              icon={<ColumnsIcon className="w-4 h-4 text-brand-navy" />}
              title={t('Tỉ lệ DHU (%) theo khâu kiểm')}
            >
              {dhuByStage.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dhuByStage} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={TICK_STYLE}
                        axisLine={{ stroke: AXIS_LINE_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={TICK_STYLE}
                        axisLine={{ stroke: AXIS_LINE_COLOR }}
                        tickLine={false}
                        unit="%"
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_COLOR }}
                        formatter={(value) => [`${value}%`, t('Tỉ lệ DHU')]}
                      />
                      <Bar dataKey="dhuPercent" name={t('Tỉ lệ DHU (%)')} fill={COLUMN_BAR_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </BlockPanel>
          </>
        )}
      </div>
    </div>
  )
}
