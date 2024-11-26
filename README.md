 # API接口文档



## 获取验证码
- **URL**: `/login/sendAuthCode`
- **Method**: POST
- **Data**:
  ```json
  {
    "account": "用户邮箱"
  }

## 邮箱验证码登录
- **URL**: `/login/codeLogin`
- **Method**: POST
- **Data**:
  ```json
  {
    "account": "用户邮箱",
    "authCode": "邮箱验证码"
  }

## 密码登录
- **URL**: `/login/passwordLogin`
- **Method**: POST
- **Data**:
  ```json
  {
    "account": "用户邮箱",
    "password": "密码"
  }

## 获取用户信息
- **URL**: `/user/getUserInfo`
- **Method**: GET
- **Params**:
  ```json
  {
    "account": "用户邮箱"
  }

## 退出登录
- **URL**: `/user/logout`
- **Method**: POST
- **Data**:
  ```json
  {
    "account": "用户邮箱"
  }