# Vercel 환경 변수 설정 가이드

## 문제 해결

프로덕션 환경에서 `localhost:8000`을 호출하는 문제는 Vercel 환경 변수가 설정되지 않았거나 빌드 시점에 포함되지 않아서 발생합니다.

## 해결 방법

### 1. Vercel 대시보드에서 환경 변수 설정

1. Vercel 대시보드 접속: https://vercel.com
2. `early-retire-lab` 프로젝트 선택
3. **Settings** > **Environment Variables** 이동
4. 다음 환경 변수 추가:

   **Key**: `VITE_API_BASE_URL`
   **Value**: `https://your-backend-project.vercel.app` (실제 백엔드 Vercel URL)
   **Environment**: 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

   **Key**: `VITE_SUPABASE_URL` (인증 기능 사용 시)
   **Value**: `https://your-project.supabase.co` (Supabase 프로젝트 URL)
   **Environment**: 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

   **Key**: `VITE_SUPABASE_ANON_KEY` (인증 기능 사용 시)
   **Value**: `your_supabase_anon_key` (Supabase Anon Key)
   **Environment**: 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### 2. 재배포

환경 변수를 추가한 후:
- **Deployments** 탭으로 이동
- 최신 배포의 **"..."** 메뉴 클릭
- **Redeploy** 선택

또는 새로운 커밋을 푸시하면 자동으로 재배포됩니다.

### 3. 환경 변수 확인

배포 후 브라우저 콘솔에서 확인:
```javascript
// 개발 모드에서만 출력됨
console.log('API_BASE_URL:', API_BASE_URL);
```

또는 네트워크 탭에서 API 요청 URL을 확인하세요.

## 백엔드 CORS 설정

백엔드도 Vercel에 배포되어 있다면, CORS는 이미 `allow_origins=["*"]`로 설정되어 있어 추가 설정이 필요 없습니다.

필요시 백엔드 환경 변수에 `ALLOWED_ORIGINS`를 설정하여 특정 도메인만 허용할 수 있습니다:
- `ALLOWED_ORIGINS=https://early-retire-lab.vercel.app,https://www.yourdomain.com`

## Supabase 인증 설정 (선택사항)

인증 기능을 사용하지 않는다면 Supabase 환경 변수는 설정하지 않아도 됩니다.
경고 메시지는 개발 환경에서만 표시되며, 프로덕션에서는 표시되지 않습니다.

인증 기능을 사용하려면:
1. Supabase 프로젝트 생성: https://supabase.com
2. Settings > API에서 URL과 Anon Key 확인
3. 위의 환경 변수 설정 방법에 따라 추가

## 문제가 계속되면

1. 환경 변수가 제대로 설정되었는지 확인
2. 재배포 후 브라우저 캐시 클리어 (Ctrl+Shift+R)
3. Vercel 빌드 로그에서 환경 변수 로드 확인
4. 개발 환경에서만 경고가 표시되는지 확인 (프로덕션에서는 표시 안 됨)

