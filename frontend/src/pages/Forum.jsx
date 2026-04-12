import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../api/client'

export default function Forum() {
  const { t } = useTranslation()
  const [posts, setPosts] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  const loadPosts = () => {
    setLoading(true)
    api.getForumPosts()
      .then((res) => setPosts(Array.isArray(res) ? res : (res.posts || [])))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newCity.trim() || !newContent.trim()) return
    setPosting(true)
    try {
      await api.createForumPost({ title: newTitle, city: newCity, content: newContent })
      setNewTitle('')
      setNewCity('')
      setNewContent('')
      loadPosts()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        {t('forum.title')}
      </h1>

      {/* Post form */}
      <Card className="mb-8">
        <form onSubmit={handlePost} className="space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('forum.title') || '討論標題'}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{t('forum.selectCity') || '選擇城市'}</option>
            <option value="台北">台北</option>
            <option value="新北">新北</option>
            <option value="桃園">桃園</option>
            <option value="台中">台中</option>
            <option value="台南">台南</option>
            <option value="高雄">高雄</option>
            <option value="新竹">新竹</option>
            <option value="其他">其他</option>
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t('forum.content')}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={posting}>
            {posting ? t('common.loading') : t('forum.post')}
          </Button>
        </form>
      </Card>

      {/* Posts */}
      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12 text-gray-500">{t('common.noData')}</Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{post.title}</h3>
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                <span>{post.city}</span>
                {post.salaryRange && <span>• {post.salaryRange}</span>}
                <span>• {new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
