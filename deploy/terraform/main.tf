// Terraform skeleton for provisioning MongoDB Atlas (requires MongoDB Atlas provider setup)
// See README in this folder for instructions.

terraform {
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.4"
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

resource "mongodbatlas_project" "project" {
  name   = var.project_name
  org_id = var.org_id
}

resource "mongodbatlas_cluster" "cluster" {
  project_id   = mongodbatlas_project.project.id
  name         = "sports-complex-cluster"
  provider_name = "AWS"
  provider_instance_size_name = "M10"
  provider_region_name = var.region
}
