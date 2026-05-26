import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyInvitation, acceptInvitation, VerifyInvitationResponse } from '../api/invitation';
import { getAuthToken } from '../components/dashboard/utils/dashboardUtils';

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<VerifyInvitationResponse | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc không tồn tại.');
      setLoading(false);
      return;
    }

    verifyInvitation(token)
      .then(data => {
        setInvitationInfo(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Có lỗi xảy ra khi xác thực thư mời.');
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    const authToken = getAuthToken();
    if (!authToken) {
      // Not logged in -> Redirect to login with return url
      navigate(`/login?returnUrl=/invite/accept?token=${token}`);
      return;
    }

    try {
      setAccepting(true);
      await acceptInvitation(token);
      alert('Chấp nhận lời mời thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi chấp nhận lời mời.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Đang kiểm tra thư mời...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4 text-4xl">❌</div>
            <h2 className="text-xl font-bold mb-2">Không thể xác nhận</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Về trang chủ
            </button>
          </>
        ) : invitationInfo ? (
          <>
            <div className="text-blue-500 mb-4 text-4xl">✉️</div>
            <h2 className="text-xl font-bold mb-2">Bạn có một lời mời!</h2>
            <p className="text-gray-600 mb-6">
              Bạn được mời tham gia vào <strong>{invitationInfo.targetType}</strong> với vai trò <strong>{invitationInfo.role}</strong>.
            </p>
            
            {!getAuthToken() && (
              <div className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded">
                Bạn cần phải <strong>Đăng nhập</strong> hoặc <strong>Tạo tài khoản</strong> bằng email <strong>{invitationInfo.email}</strong> để tiếp tục.
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              className={`w-full py-2 px-4 rounded font-medium text-white ${
                accepting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {accepting ? 'Đang xử lý...' : (!getAuthToken() ? 'Đăng nhập để chấp nhận' : 'Chấp nhận tham gia')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AcceptInvite;
