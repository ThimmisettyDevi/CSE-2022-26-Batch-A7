import React from 'react'
import "./App.css"
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from './AuthenticationPages/AuthProvider'
import LandingPage from "./LandingPage"
import PrivateRoute from './AuthenticationPages/PrivateRoute'
import AuthPage from './AuthenticationPages/AuthPage'
import RegisterPage from './AuthenticationPages/RegisterPage'
import LoginPage from './AuthenticationPages/LoginPage'
import ChatBot from './ChatBot'
import Sidebar from './Sidebar'
import UserDashboard from './User/UserDashboard'
import ProfilePage from './User/ProfilePage'
import ViewAllApplications from './User/ViewAllApplications'
import MyApplications from './User/MyApplications'
import AdminDashboard from './ADMIN/AdminDashboard'
import ManageStudents from './ADMIN/ManageStudents'
import ManageCompanies from './ADMIN/ManageCompanies'
import ManageInternships from './ADMIN/ManageInternships'
import AdminMonitoringDashboard from './ADMIN/AdminMonitoringDashboard'
import CompanyDashboard from './COMPANY/CompanyDashboard'
import CompanyProfile from './COMPANY/CompanyProfile'
import CompanyManageInternships from './COMPANY/ManageInternships'
import ViewApplications from './ADMIN/ViewApplications'
import MyInterviews from './User/MyInterviews'
import CompanyApplications from './COMPANY/CompanyApplications'
import CompanyReports from './COMPANY/CompanyReports'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatBot />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/user/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/internships"
            element={
              <PrivateRoute>
                <ViewAllApplications />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/applications"
            element={
              <PrivateRoute>
                <MyApplications />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/interviews"
            element={
              <PrivateRoute>
                <MyInterviews />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <PrivateRoute>
                <ManageStudents />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <PrivateRoute>
                <ManageCompanies />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/internships"
            element={
              <PrivateRoute>
                <ManageInternships />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <PrivateRoute>
                <AdminMonitoringDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <PrivateRoute>
                <CompanyDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <PrivateRoute>
                <CompanyProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/internships"
            element={
              <PrivateRoute>
                <CompanyManageInternships />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/applications"
            element={
              <PrivateRoute>
                <CompanyApplications />
              </PrivateRoute>
            }
          />
             <Route
            path="/company/reports"
            element={
              <PrivateRoute>
                <CompanyReports />
              </PrivateRoute>
            }
          />



        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />

      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
