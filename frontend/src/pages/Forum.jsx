import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../api/client'

export default function Forum() {
  const { t } = useTranslation()
  const [posts, setPosts] = useState([])
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  const loadPosts = () => {
    setLoading(true)
    api.getForum()
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newContent.trim()) return
    setPosting(true)
    try {
      await api.postForum({ content: newContent })
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
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-brand-600 dark:text-brand-400">
                  {t('forum.author')}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
